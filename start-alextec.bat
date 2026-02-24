@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

title AlexTec Bootstrap

echo =============================================
echo   AlexTec - Inicializacao local (Windows)
echo =============================================

echo.
echo Escolha uma opcao:
echo [1] Diagnosticar e instalar pre-requisitos (recomendado na 1a vez)
echo [2] Apenas iniciar projeto (assumindo pre-requisitos instalados)
set /p MODE="Digite 1 ou 2 e pressione Enter: "

if "%MODE%"=="1" goto :INSTALL_MODE
if "%MODE%"=="2" goto :RUN_MODE

echo [ERRO] Opcao invalida.
exit /b 1

:INSTALL_MODE
echo.
echo [INFO] Iniciando diagnostico de pre-requisitos...
call :ensure_command winget
if !errorlevel! equ 0 (
  set "PKG_MANAGER=winget"
) else (
  call :ensure_command choco
  if !errorlevel! equ 0 (
    set "PKG_MANAGER=choco"
  ) else (
    set "PKG_MANAGER="
  )
)

if "%PKG_MANAGER%"=="" (
  echo [AVISO] Nenhum gerenciador de pacotes detectado ^(winget/choco^).
  echo         O script vai apenas informar o que falta.
) else (
  echo [INFO] Gerenciador detectado: %PKG_MANAGER%
)

call :ensure_or_install_docker
if errorlevel 1 exit /b 1

call :ensure_or_install_node
if errorlevel 1 exit /b 1

call :ensure_command npm
if errorlevel 1 (
  echo [ERRO] npm ainda nao esta disponivel no PATH.
  echo Feche e reabra o terminal e rode o script novamente.
  exit /b 1
)

call :ensure_command npx
if errorlevel 1 (
  echo [ERRO] npx ainda nao esta disponivel no PATH.
  echo Feche e reabra o terminal e rode o script novamente.
  exit /b 1
)

goto :RUN_MODE

:RUN_MODE
echo.
echo [INFO] Validando comandos necessarios...
call :ensure_command docker
if errorlevel 1 (
  echo [ERRO] Docker nao encontrado no PATH.
  echo Rode novamente no modo 1 para tentar instalar automaticamente.
  exit /b 1
)

call :ensure_command npm
if errorlevel 1 (
  echo [ERRO] npm nao encontrado no PATH.
  echo Rode novamente no modo 1 para tentar instalar automaticamente.
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    echo [INFO] Criando .env a partir de .env.example...
    copy /y ".env.example" ".env" >nul
  ) else (
    echo [ERRO] Arquivo .env.example nao encontrado.
    exit /b 1
  )
)

echo [1/6] Subindo PostgreSQL no Docker...
docker compose up -d
if errorlevel 1 (
  echo [ERRO] Falha ao subir containers Docker.
  echo Verifique se o Docker Desktop esta aberto.
  exit /b 1
)

echo [2/6] Instalando dependencias...
call npm install
if errorlevel 1 (
  echo [ERRO] Falha ao instalar dependencias.
  exit /b 1
)

echo [3/6] Gerando cliente Prisma...
call npx prisma generate
if errorlevel 1 (
  echo [ERRO] Falha no prisma generate.
  exit /b 1
)

echo [4/6] Executando migrations...
call npx prisma migrate dev
if errorlevel 1 (
  echo [ERRO] Falha no prisma migrate dev.
  exit /b 1
)

echo [5/6] Executando seed...
call npx prisma db seed
if errorlevel 1 (
  echo [ERRO] Falha no prisma db seed.
  exit /b 1
)

echo [6/6] Iniciando aplicacao Next.js...
start "" http://localhost:3000
call npm run dev
exit /b 0

:ensure_command
where %1 >nul 2>nul
if errorlevel 1 (
  exit /b 1
)
exit /b 0

:ensure_or_install_node
call :ensure_command node
if !errorlevel! equ 0 (
  for /f "tokens=*" %%v in ('node -v') do set "NODE_VERSION=%%v"
  echo [OK] Node detectado: !NODE_VERSION!
  exit /b 0
)

echo [FALTA] Node.js nao encontrado.
if "%PKG_MANAGER%"=="winget" (
  echo [INFO] Instalando Node.js LTS via winget...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar Node.js com winget.
    exit /b 1
  )
  echo [INFO] Node.js instalado. Pode ser necessario abrir novo terminal.
  exit /b 0
)
if "%PKG_MANAGER%"=="choco" (
  echo [INFO] Instalando Node.js LTS via Chocolatey...
  choco install nodejs-lts -y
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar Node.js com choco.
    exit /b 1
  )
  echo [INFO] Node.js instalado. Pode ser necessario abrir novo terminal.
  exit /b 0
)

echo [ERRO] Instale Node.js LTS manualmente: https://nodejs.org/
exit /b 1

:ensure_or_install_docker
call :ensure_command docker
if !errorlevel! equ 0 (
  echo [OK] Docker detectado.
  exit /b 0
)

echo [FALTA] Docker nao encontrado.
if "%PKG_MANAGER%"=="winget" (
  echo [INFO] Instalando Docker Desktop via winget...
  winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar Docker com winget.
    exit /b 1
  )
  echo [INFO] Docker instalado. Abra o Docker Desktop e rode o script novamente se necessario.
  exit /b 0
)
if "%PKG_MANAGER%"=="choco" (
  echo [INFO] Instalando Docker Desktop via Chocolatey...
  choco install docker-desktop -y
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar Docker com choco.
    exit /b 1
  )
  echo [INFO] Docker instalado. Abra o Docker Desktop e rode o script novamente se necessario.
  exit /b 0
)

echo [ERRO] Instale Docker Desktop manualmente: https://www.docker.com/products/docker-desktop/
exit /b 1
