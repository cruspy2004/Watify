$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $workspace ".local-postgres\data"
$runDir = Join-Path $workspace ".local-postgres\run"
$passwordFile = Join-Path $workspace ".local-postgres\pw.txt"
$initdb = (Get-Command initdb).Source

if (Test-Path (Join-Path $dataDir "PG_VERSION")) {
    Write-Host "Local PostgreSQL cluster already initialized at $dataDir"
    exit 0
}

New-Item -ItemType Directory -Force $dataDir | Out-Null
New-Item -ItemType Directory -Force $runDir | Out-Null
Set-Content -Path $passwordFile -Value "watify_dev_password" -NoNewline

try {
    & $initdb -D $dataDir -U watify -A scram-sha-256 "--pwfile=$passwordFile"
    Write-Host "Initialized local PostgreSQL cluster in $dataDir"
} finally {
    if (Test-Path $passwordFile) {
        Remove-Item $passwordFile -Force
    }
}
