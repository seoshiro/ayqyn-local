$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Node 24 and pnpm 11 are required.' }
node scripts/download-runtime-models.mjs
if ($LASTEXITCODE -ne 0) { throw 'Model download/hash verification failed.' }
node scripts/prepare-runtime.mjs
if ($LASTEXITCODE -ne 0) { throw 'Runtime preparation failed.' }
Write-Output 'Setup complete. Run pnpm start. No Python required. Camera remains off until consent.'
