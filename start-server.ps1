# PowerShell start script: installs dependencies and starts the Node server
Set-Location -Path $PSScriptRoot
Write-Host "Checking Node & npm versions..."
node -v 2>$null; if ($LASTEXITCODE -ne 0) { Write-Host "Node not found. Please install Node.js from https://nodejs.org/"; exit 1 }
npm -v 2>$null; if ($LASTEXITCODE -ne 0) { Write-Host "npm not found. Ensure Node.js installation includes npm."; exit 1 }

Write-Host "Installing dependencies..."
npm install

Write-Host "Starting server (press Ctrl+C to stop)..."
npm start
