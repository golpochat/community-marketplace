# Pilot smoke test — run against local, staging, or production API.
# Usage:
#   .\scripts\smoke-pilot.ps1
#   .\scripts\smoke-pilot.ps1 -BaseUrl "https://api.staging.community.market"
#   .\scripts\smoke-pilot.ps1 -BaseUrl "http://localhost:4000" -LoginEmail "seller@community.market" -LoginPassword "ChangeMe!Seller1"

param(
    [string]$BaseUrl = "http://localhost:4000",
    [string]$LoginEmail = "",
    [string]$LoginPassword = ""
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")
$passed = 0
$failed = 0
$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Path,
        [int[]]$ExpectedStatus = @(200),
        [switch]$Optional
    )

    $url = "$BaseUrl$Path"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
        $ok = $ExpectedStatus -contains $response.StatusCode
        if ($ok) {
            $script:passed++
            $script:results += [pscustomobject]@{ Test = $Name; Status = "PASS"; Detail = "$($response.StatusCode)" }
            Write-Host "[PASS] $Name ($($response.StatusCode))" -ForegroundColor Green
        } else {
            $script:failed++
            $script:results += [pscustomobject]@{ Test = $Name; Status = "FAIL"; Detail = "Expected $($ExpectedStatus -join '/'), got $($response.StatusCode)" }
            Write-Host "[FAIL] $Name - expected $($ExpectedStatus -join '/'), got $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        if ($Optional) {
            $script:results += [pscustomobject]@{ Test = $Name; Status = "SKIP"; Detail = $_.Exception.Message }
            Write-Host "[SKIP] $Name (optional) - $($_.Exception.Message)" -ForegroundColor Yellow
        } else {
            $script:failed++
            $script:results += [pscustomobject]@{ Test = $Name; Status = "FAIL"; Detail = $_.Exception.Message }
            Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Pilot smoke test ===" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl"
Write-Host ""

Test-Endpoint -Name "Health live" -Path "/api/health/live"
Test-Endpoint -Name "Health ready" -Path "/api/health/ready"
Test-Endpoint -Name "Health queues" -Path "/api/health/queues" -Optional
Test-Endpoint -Name "Listings browse" -Path "/api/listings?limit=1"
Test-Endpoint -Name "Listings search" -Path '/api/listings/search?q=test&limit=1'
Test-Endpoint -Name "Listings feeds" -Path '/api/listings/feeds?feed=new_near_you&latitude=53.3498&longitude=-6.2603&limit=1'
Test-Endpoint -Name "Community stats" -Path "/api/listings/community-stats"

if ($LoginEmail -and $LoginPassword) {
    try {
        $body = @{ email = $LoginEmail; password = $LoginPassword } | ConvertTo-Json
        $login = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 15
        if ($login.StatusCode -eq 200 -or $login.StatusCode -eq 201) {
            $passed++
            $results += [pscustomobject]@{ Test = "Auth login"; Status = "PASS"; Detail = "$($login.StatusCode)" }
            Write-Host "[PASS] Auth login ($($login.StatusCode))" -ForegroundColor Green
        } else {
            $failed++
            $results += [pscustomobject]@{ Test = "Auth login"; Status = "FAIL"; Detail = "$($login.StatusCode)" }
            Write-Host "[FAIL] Auth login - $($login.StatusCode)" -ForegroundColor Red
        }
    } catch {
        $failed++
        $results += [pscustomobject]@{ Test = "Auth login"; Status = "FAIL"; Detail = $_.Exception.Message }
        Write-Host "[FAIL] Auth login - $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "[SKIP] Auth login - pass -LoginEmail and -LoginPassword to test" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed  Failed: $failed"
$results | Format-Table -AutoSize

if ($failed -gt 0) {
    exit 1
}
exit 0
