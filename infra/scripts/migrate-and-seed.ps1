# Migrate + seed RBAC (PowerShell)
# Usage: .\infra\scripts\migrate-and-seed.ps1
#        .\infra\scripts\migrate-and-seed.ps1 -NodeEnv staging

param(
  [string]$NodeEnv = "development"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

if ($NodeEnv -eq "production" -and $env:RBAC_SEED_FORCE -ne "true") {
  Write-Error "migrate-and-seed is blocked in production."
}

$env:NODE_ENV = $NodeEnv
Write-Host "==> migrate-and-seed (NODE_ENV=$NodeEnv)"

if ($NodeEnv -eq "staging" -or $NodeEnv -eq "test") {
  pnpm --filter @community-marketplace/api run prisma:migrate:deploy
  & "$PSScriptRoot\seed-rbac.ps1" -NodeEnv $NodeEnv
} else {
  pnpm --filter @community-marketplace/api run migrate:seed
}
Write-Host "==> migrate-and-seed complete"
