# Public SEO smoke test — run against production or local web.
#
# Usage:
#   .\scripts\smoke-seo.ps1
#   .\scripts\smoke-seo.ps1 -BaseUrl "http://localhost:3000"

param(
    [string]$BaseUrl = "https://sellnearby.ie"
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")
$passed = 0
$failed = 0
$results = @()

function Test-SeoEndpoint {
    param(
        [string]$Name,
        [string]$Path,
        [string[]]$MustContain = @()
    )

    $url = "$BaseUrl$Path"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 25
        if ($response.StatusCode -ne 200) {
            throw "Expected 200, got $($response.StatusCode)"
        }

        foreach ($needle in $MustContain) {
            if ($response.Content -notmatch [regex]::Escape($needle)) {
                throw "Response missing expected content: $needle"
            }
        }

        $script:passed++
        $script:results += [pscustomobject]@{ Test = $Name; Status = "PASS"; Detail = "200" }
        Write-Host "[PASS] $Name" -ForegroundColor Green
    } catch {
        $script:failed++
        $script:results += [pscustomobject]@{ Test = $Name; Status = "FAIL"; Detail = $_.Exception.Message }
        Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== SEO smoke test ===" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl"
Write-Host ""

Test-SeoEndpoint -Name "robots.txt" -Path "/robots.txt" -MustContain @("Sitemap:", "Disallow: /admin")
Test-SeoEndpoint -Name "sitemap.xml" -Path "/sitemap.xml" -MustContain @("<urlset", "<loc>$BaseUrl/")
Test-SeoEndpoint -Name "llms.txt" -Path "/llms.txt" -MustContain @("SellNearby")
Test-SeoEndpoint -Name "listings browse SSR" -Path "/listings" -MustContain @("<!DOCTYPE html>")
Test-SeoEndpoint -Name "guides hub" -Path "/guides" -MustContain @("<!DOCTYPE html>")

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed  Failed: $failed"
$results | Format-Table -AutoSize

if ($failed -gt 0) { exit 1 }
exit 0
