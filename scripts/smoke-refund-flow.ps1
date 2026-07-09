# Refund workflow smoke test — buyer request → admin pending list → approve.
#
# Requires seeded dev users and a succeeded payment (see apps/api seed:test-data).
#
# Usage:
#   .\scripts\smoke-refund-flow.ps1
#   .\scripts\smoke-refund-flow.ps1 -BaseUrl "https://api.sellnearby.ie" -PaymentId "uuid"

param(
    [string]$BaseUrl = "http://localhost:4000",
    [string]$PaymentId = "00000000-0000-4000-9000-000000000100",
    [string]$BuyerEmail = "buyer@community.market",
    [string]$BuyerPassword = "ChangeMe!Buyer1",
    [string]$AdminEmail = "admin@community.market",
    [string]$AdminPassword = "ChangeMe!Admin1"
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")
$passed = 0
$failed = 0

function Write-Pass([string]$Name, [string]$Detail = "") {
    $script:passed++
    Write-Host "[PASS] $Name $Detail" -ForegroundColor Green
}

function Write-Fail([string]$Name, [string]$Detail) {
    $script:failed++
    Write-Host "[FAIL] $Name - $Detail" -ForegroundColor Red
}

function Get-AccessToken {
    param([string]$Email, [string]$Password)

    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 20
    $token = $login.data.accessToken
    if (-not $token) {
        throw "Login response missing accessToken for $Email"
    }
    return $token
}

function Get-ApiErrorMessage {
    param($ErrorRecord)
    if ($ErrorRecord.ErrorDetails.Message) {
        return $ErrorRecord.ErrorDetails.Message
    }
    return $ErrorRecord.Exception.Message
}

Write-Host ""
Write-Host "=== Refund flow smoke test ===" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl"
Write-Host "Payment: $PaymentId"
Write-Host ""

try {
    $buyerToken = Get-AccessToken -Email $BuyerEmail -Password $BuyerPassword
    Write-Pass "Buyer login"
} catch {
    Write-Fail "Buyer login" (Get-ApiErrorMessage $_)
    exit 1
}

$refundId = $null
try {
    $body = @{ paymentId = $PaymentId; reason = "Automated refund smoke test" } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "$BaseUrl/api/buyer/payments/refunds" -Method POST `
        -Headers @{ Authorization = "Bearer $buyerToken" } -Body $body -ContentType "application/json" -TimeoutSec 20
    $refundId = $created.data.id
    Write-Pass "Buyer refund request" "id=$refundId"
} catch {
    $message = Get-ApiErrorMessage $_
    if ($message -match "already exists") {
        Write-Host "[INFO] Refund already pending - continuing with admin list" -ForegroundColor Yellow
    } else {
        Write-Fail "Buyer refund request" $message
    }
}

try {
    $adminToken = Get-AccessToken -Email $AdminEmail -Password $AdminPassword
    Write-Pass "Admin login"
} catch {
    Write-Fail "Admin login" (Get-ApiErrorMessage $_)
    exit 1
}

try {
    $pendingUrl = "$BaseUrl/api/admin/payments/refunds/pending?page=1" + '&limit=10'
    $pending = Invoke-RestMethod -Uri $pendingUrl `
        -Headers @{ Authorization = "Bearer $adminToken" } -TimeoutSec 20
    $rows = $pending.data.data
    if (-not $rows) {
        throw "No pending refunds returned"
    }

    $target = $rows | Where-Object { $_.paymentId -eq $PaymentId } | Select-Object -First 1
    if (-not $target) {
        $target = $rows | Select-Object -First 1
    }

    if (-not $target.listingTitle) {
        throw "listingTitle missing on pending refund row"
    }
    if (-not $target.buyerEmail) {
        throw "buyerEmail missing on pending refund row"
    }

    $refundId = $target.id
    Write-Pass "Admin pending refunds" "listing=$($target.listingTitle) buyer=$($target.buyerEmail)"
} catch {
    Write-Fail "Admin pending refunds" (Get-ApiErrorMessage $_)
    exit 1
}

try {
    $body = @{ refundId = $refundId; approve = $true } | ConvertTo-Json
    $approved = Invoke-RestMethod -Uri "$BaseUrl/api/admin/payments/refunds/approve" -Method POST `
        -Headers @{ Authorization = "Bearer $adminToken" } -Body $body -ContentType "application/json" -TimeoutSec 30
    if ($approved.data.status -notin @("processed", "approved")) {
        throw "Unexpected refund status: $($approved.data.status)"
    }
    Write-Pass "Admin approve refund" "status=$($approved.data.status)"
} catch {
    Write-Fail "Admin approve refund" (Get-ApiErrorMessage $_)
    exit 1
}

try {
    $payment = Invoke-RestMethod -Uri "$BaseUrl/api/buyer/payments/$PaymentId" `
        -Headers @{ Authorization = "Bearer $buyerToken" } -TimeoutSec 20
    if ($payment.data.status -ne "refunded") {
        throw "Payment status is $($payment.data.status), expected refunded"
    }
    Write-Pass "Payment marked refunded"
} catch {
    Write-Fail "Payment marked refunded" (Get-ApiErrorMessage $_)
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed  Failed: $failed"

if ($failed -gt 0) { exit 1 }
exit 0
