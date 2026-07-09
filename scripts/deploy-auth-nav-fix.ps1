# Deploy auth/nav/session fixes to OVH VPS (run from your PC if SSH is configured).
# Prerequisite: SSH access to the VPS as the deploy user.
#
# Usage:
#   .\scripts\deploy-auth-nav-fix.ps1
#   .\scripts\deploy-auth-nav-fix.ps1 -SshHost "ubuntu@YOUR_VPS_IP"
#   .\scripts\deploy-auth-nav-fix.ps1 -LookupEmail "sujan@sellnearby.ie"

param(
  [string]$SshHost = "ubuntu@sellnearby.ie",
  [string]$LookupEmail = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==> Deploying latest main to VPS via vps-update.sh" -ForegroundColor Cyan
ssh $SshHost @"
set -e
cd /opt/sellnearby
git fetch origin main
git pull --ff-only origin main
chmod +x infra/scripts/vps-update.sh infra/scripts/lookup-user-prod-docker.sh
./infra/scripts/vps-update.sh
"@

if ($LookupEmail) {
  Write-Host "`n==> Looking up user role on production DB" -ForegroundColor Cyan
  ssh $SshHost "cd /opt/sellnearby && ./infra/scripts/lookup-user-prod-docker.sh '$LookupEmail'"
}

Write-Host "`n==> Smoke check" -ForegroundColor Cyan
try {
  $health = Invoke-RestMethod -Uri "https://api.sellnearby.ie/api/health/ready" -TimeoutSec 30
  Write-Host "API health:" ($health | ConvertTo-Json -Compress)
} catch {
  Write-Host "Could not reach production API from this machine: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host @"

Verify in browser:
  https://sellnearby.ie/super-admin/dashboard  -> Super Admin panel
  https://sellnearby.ie/admin/dashboard        -> Admin panel
  https://admin.sellnearby.ie                  -> 308 redirect to sellnearby.ie (canonical)
"@ -ForegroundColor Green
