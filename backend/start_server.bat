@echo off
REM Script para iniciar o servidor SafeClicker Backend
REM Este script configura automaticamente o PYTHONPATH

echo Starting SafeClicker Backend...
echo.

REM Definir PYTHONPATH para o diretório backend
set PYTHONPATH=%~dp0

REM Executar o uvicorn acessível na rede local
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
