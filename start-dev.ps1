$ErrorActionPreference = "Stop"

$workspace = $PSScriptRoot
$backendDir = Join-Path $workspace "backend"
$frontendDir = Join-Path $workspace "frontend"
$logDir = Join-Path $workspace ".codex-logs"

New-Item -ItemType Directory -Force $logDir | Out-Null

$dbListening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 5433 }
if (-not $dbListening) {
    & (Join-Path $workspace "scripts\local-db-start.ps1")
}

$backendListening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 5001 }
if (-not $backendListening) {
    Start-Process powershell -WindowStyle Hidden -ArgumentList `
        "-NoProfile", `
        "-ExecutionPolicy", "Bypass", `
        "-Command", "Set-Location '$backendDir'; npm run dev *> '$logDir\backend.log'"
    Write-Host "Started backend on port 5001"
} else {
    Write-Host "Backend is already running on port 5001"
}

$frontendListening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 3000 }
if (-not $frontendListening) {
    Start-Process powershell -WindowStyle Hidden -ArgumentList `
        "-NoProfile", `
        "-ExecutionPolicy", "Bypass", `
        "-Command", "Set-Location '$frontendDir'; npm start *> '$logDir\frontend.log'"
    Write-Host "Started frontend on port 3000"
} else {
    Write-Host "Frontend is already running on port 3000"
}

Write-Host "Watify is available at http://localhost:3000"
