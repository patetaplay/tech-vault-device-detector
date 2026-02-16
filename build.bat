@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

title PainelAtendimento - Gerar EXE

echo =============================================
echo  PainelAtendimento - Preparar e Gerar .EXE
echo =============================================
echo.

if not exist package.json (
  echo [ERRO] package.json nao encontrado nesta pasta.
  echo Abra a pasta correta do projeto e tente novamente.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm nao encontrado.
  echo Reinstale Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)

echo [1/4] Verificando versoes...
node -v
npm -v

echo.
echo [2/4] Instalando/atualizando dependencias...
call npm install
if errorlevel 1 (
  echo.
  echo [ERRO] Falha no npm install.
  echo Dica: verifique internet, proxy e permissao de rede para registry.npmjs.org.
  pause
  exit /b 1
)

echo.
echo [3/4] Gerando instalador Windows (.exe)...
call npm run dist:win
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao gerar o .exe.
  echo Confira os logs acima para entender o problema.
  pause
  exit /b 1
)

echo.
echo [4/4] Finalizado com sucesso.
set "OUTPUT_DIR=%cd%\dist"
echo Pasta de saida: %OUTPUT_DIR%

echo.
set "FOUND_EXE=0"
for %%f in ("%OUTPUT_DIR%\*.exe") do (
  set "FOUND_EXE=1"
  echo Instalador encontrado: %%~nxf
)

if "%FOUND_EXE%"=="0" (
  echo Nenhum .exe localizado automaticamente em %OUTPUT_DIR%.
  echo Verifique subpastas dentro de dist.
)

echo.
if exist "%OUTPUT_DIR%" start "" "%OUTPUT_DIR%"

echo Pronto! Agora e so instalar e abrir o PainelAtendimento.
pause
exit /b 0
