@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   PainelAtendimento - Build Windows .exe
echo ========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm nao encontrado. Instale Node.js LTS e tente novamente.
  echo Download: https://nodejs.org/
  pause
  exit /b 1
)

echo [1/3] Instalando dependencias...
call npm install
if errorlevel 1 (
  echo.
  echo [ERRO] Falha no npm install.
  echo Verifique internet/proxy/permissoes e tente novamente.
  pause
  exit /b 1
)

echo.
echo [2/3] Gerando instalador Windows (.exe)...
call npm run dist:win
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao gerar o .exe.
  echo Veja os logs acima para detalhes.
  pause
  exit /b 1
)

echo.
set "OUTPUT_DIR=%cd%\dist"
echo [3/3] Build concluido com sucesso!
echo Pasta de saida: %OUTPUT_DIR%

echo.
for %%f in ("%OUTPUT_DIR%\*.exe") do (
  echo Instalador encontrado: %%~nxf
)

echo.
echo Processo finalizado.
pause
exit /b 0
