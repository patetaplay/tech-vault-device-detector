@echo off
setlocal

cd /d "%~dp0"

title PainelAtendimento - Abrir App

echo ========================================
echo   PainelAtendimento - Abrir Aplicativo
echo ========================================
echo.

if not exist package.json (
  echo [ERRO] package.json nao encontrado nesta pasta.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Dependencias nao encontradas. Instalando...
  call npm install
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

echo Iniciando aplicativo desktop...
call npm start
if errorlevel 1 (
  echo.
  echo [ERRO] Nao foi possivel iniciar o app.
  echo Tente executar build.bat para preparar o ambiente.
  pause
  exit /b 1
)

endlocal
exit /b 0
