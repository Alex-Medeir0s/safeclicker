# Script para iniciar o servidor SafeClicker Backend
# Este script configura automaticamente o PYTHONPATH

Write-Host "Starting SafeClicker Backend..." -ForegroundColor Green
Write-Host ""

# Definir PYTHONPATH para o diretório backend
$env:PYTHONPATH = (Get-Location).Path

# Executar o uvicorn
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

Write-Host ""
Write-Host "Press any key to close..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
