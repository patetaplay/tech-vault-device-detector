@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo =============================================
echo   AlexTec - Inicializacao local (Windows)
echo =============================================

echo.
where docker >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Docker nao encontrado no PATH.
  echo Instale o Docker Desktop e tente novamente.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm nao encontrado no PATH.
  echo Instale Node.js 18+ e tente novamente.
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
