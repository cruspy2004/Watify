$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $workspace ".local-postgres\data"
$pgCtl = (Get-Command pg_ctl).Source

if (-not (Test-Path (Join-Path $dataDir "PG_VERSION"))) {
    Write-Host "Local PostgreSQL cluster is not initialized."
    exit 0
}

& $pgCtl -D $dataDir stop | Out-Host
