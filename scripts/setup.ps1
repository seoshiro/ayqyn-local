$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
python -m venv .venv
if ($LASTEXITCODE -ne 0) { throw 'Python 3.12 is required.' }
& '.\.venv\Scripts\python.exe' -m pip install -r requirements.lock.txt
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Node dependency installation failed.' }
& '.\.venv\Scripts\python.exe' scripts/download-models.py
if ($LASTEXITCODE -ne 0) { throw 'Model verification failed.' }
Write-Output 'Setup complete. Run pnpm start. Camera remains off until consent.'
