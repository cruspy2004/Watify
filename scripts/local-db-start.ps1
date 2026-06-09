$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $workspace ".local-postgres\data"
$logFile = Join-Path $workspace ".local-postgres\postgres.log"
$pgCtl = (Get-Command pg_ctl).Source

if (-not (Test-Path (Join-Path $dataDir "PG_VERSION"))) {
    Write-Error "Local PostgreSQL cluster is not initialized. Run npm run db:local:init first."
}

$isRunning = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 5433 }
if ($isRunning) {
    Write-Host "Local PostgreSQL is already listening on port 5433"
    exit 0
}

& $pgCtl -D $dataDir -l $logFile -o "-p 5433" start | Out-Host
