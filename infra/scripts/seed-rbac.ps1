# Seed RBAC (PowerShell) — development / staging
# Usage: .\infra\scripts\seed-rbac.ps1
#        .\infra\scripts\seed-rbac.ps1 -NodeEnv staging

param(
  [string]$NodeEnv = "development"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

if ($NodeEnv -eq "production" -and $env:RBAC_SEED_FORCE -ne "true") {
  Write-Error "RBAC seed is blocked in production. Set RBAC_SEED_FORCE=true to override."
}

$env:NODE_ENV = $NodeEnv
Write-Host "==> RBAC seed (NODE_ENV=$NodeEnv)"
pnpm --filter @community-marketplace/api run seed:rbac
Write-Host "==> RBAC seed complete"
