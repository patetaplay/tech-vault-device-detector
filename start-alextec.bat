@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"
set "LOG_FILE=%~dp0alextec-bootstrap.log"

echo ============================================================
echo AlexTec Bootstrap - iniciando em %date% %time%
echo Log: %LOG_FILE%
echo ============================================================
>> "%LOG_FILE%" echo.
>> "%LOG_FILE%" echo ============================================================
>> "%LOG_FILE%" echo AlexTec Bootstrap - inicio em %date% %time%
>> "%LOG_FILE%" echo ============================================================

call :menu
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo [SUCESSO] Script finalizado sem erros.
  >> "%LOG_FILE%" echo [SUCESSO] Script finalizado sem erros.
) else (
  echo [ERRO] Script finalizado com erro ^(codigo %EXIT_CODE%^).
  echo [DICA] Veja o log em: %LOG_FILE%
  >> "%LOG_FILE%" echo [ERRO] Script finalizado com erro ^(codigo %EXIT_CODE%^).
)

echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
exit /b %EXIT_CODE%

:menu
echo.
echo Escolha uma opcao:
echo [1] Diagnosticar e instalar pre-requisitos
echo [2] Apenas iniciar projeto
set /p MODE="Digite 1 ou 2 e pressione Enter: "

if "%MODE%"=="1" goto :install_mode
if "%MODE%"=="2" goto :run_mode

echo [ERRO] Opcao invalida.
>> "%LOG_FILE%" echo [ERRO] Opcao invalida: %MODE%
exit /b 1

:install_mode
call :log "Iniciando diagnostico de pre-requisitos..."
call :detect_pkg_manager

call :ensure_or_install_docker || exit /b 1
call :ensure_or_install_node || exit /b 1
call :ensure_command npm || (
  call :log "npm nao encontrado no PATH apos instalacao. Reabra o terminal e tente novamente."
  exit /b 1
)
call :ensure_command npx || (
  call :log "npx nao encontrado no PATH apos instalacao. Reabra o terminal e tente novamente."
  exit /b 1
)

goto :run_mode

:run_mode
call :log "Validando comandos necessarios..."
call :ensure_command docker || (
  call :log "Docker nao encontrado no PATH. Rode a opcao 1 para tentar instalar automaticamente."
  exit /b 1
)
call :ensure_command npm || (
  call :log "npm nao encontrado no PATH. Rode a opcao 1 para tentar instalar automaticamente."
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    call :log "Criando .env a partir de .env.example..."
    copy /y ".env.example" ".env" >nul
  ) else (
    call :log "Arquivo .env.example nao encontrado."
    exit /b 1
  )
)

call :run_step "[1/6] Subindo PostgreSQL no Docker..." "docker compose up -d" || exit /b 1
call :run_step "[2/6] Instalando dependencias..." "npm install" || exit /b 1
call :run_step "[3/6] Gerando cliente Prisma..." "npx prisma generate" || exit /b 1
call :run_step "[4/6] Executando migrations..." "npx prisma migrate dev" || exit /b 1
call :run_step "[5/6] Executando seed..." "npx prisma db seed" || exit /b 1

call :log "[6/6] Abrindo navegador e iniciando app..."
start "" http://localhost:3000
call npm run dev
if errorlevel 1 (
  call :log "Falha ao executar npm run dev"
  exit /b 1
)

exit /b 0

:run_step
set "STEP_MSG=%~1"
set "STEP_CMD=%~2"
call :log "%STEP_MSG%"
call %STEP_CMD% >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
  call :log "Falha no comando: %STEP_CMD%"
  exit /b 1
)
exit /b 0

:detect_pkg_manager
call :ensure_command winget
if !errorlevel! equ 0 (
  set "PKG_MANAGER=winget"
  call :log "Gerenciador detectado: winget"
  exit /b 0
)

call :ensure_command choco
if !errorlevel! equ 0 (
  set "PKG_MANAGER=choco"
  call :log "Gerenciador detectado: choco"
  exit /b 0
)

set "PKG_MANAGER="
call :log "Nenhum gerenciador detectado (winget/choco)."
exit /b 0

:ensure_or_install_node
call :ensure_command node
if !errorlevel! equ 0 (
  for /f "tokens=*" %%v in ('node -v') do set "NODE_VERSION=%%v"
  call :log "Node detectado: !NODE_VERSION!"
  exit /b 0
)

call :log "Node.js nao encontrado."
if "%PKG_MANAGER%"=="winget" (
  call :log "Tentando instalar Node.js LTS via winget..."
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements >> "%LOG_FILE%" 2>&1
  if errorlevel 1 (call :log "Falha ao instalar Node.js via winget" & exit /b 1)
  call :log "Node.js instalado. Talvez seja preciso abrir novo terminal."
  exit /b 0
)
if "%PKG_MANAGER%"=="choco" (
  call :log "Tentando instalar Node.js LTS via choco..."
  choco install nodejs-lts -y >> "%LOG_FILE%" 2>&1
  if errorlevel 1 (call :log "Falha ao instalar Node.js via choco" & exit /b 1)
  call :log "Node.js instalado. Talvez seja preciso abrir novo terminal."
  exit /b 0
)

call :log "Instale Node.js manualmente: https://nodejs.org/"
exit /b 1

:ensure_or_install_docker
call :ensure_command docker
if !errorlevel! equ 0 (
  call :log "Docker detectado."
  exit /b 0
)

call :log "Docker nao encontrado."
if "%PKG_MANAGER%"=="winget" (
  call :log "Tentando instalar Docker Desktop via winget..."
  winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements >> "%LOG_FILE%" 2>&1
  if errorlevel 1 (call :log "Falha ao instalar Docker via winget" & exit /b 1)
  call :log "Docker instalado. Abra o Docker Desktop e execute novamente se necessario."
  exit /b 0
)
if "%PKG_MANAGER%"=="choco" (
  call :log "Tentando instalar Docker Desktop via choco..."
  choco install docker-desktop -y >> "%LOG_FILE%" 2>&1
  if errorlevel 1 (call :log "Falha ao instalar Docker via choco" & exit /b 1)
  call :log "Docker instalado. Abra o Docker Desktop e execute novamente se necessario."
  exit /b 0
)

call :log "Instale Docker manualmente: https://www.docker.com/products/docker-desktop/"
exit /b 1

:ensure_command
where %1 >nul 2>nul
if errorlevel 1 exit /b 1
exit /b 0

:log
echo [INFO] %~1
>> "%LOG_FILE%" echo [INFO] %~1
exit /b 0
