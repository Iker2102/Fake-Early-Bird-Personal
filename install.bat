@echo off

echo ==================================
echo  Fake Early Bird Installer
echo ==================================

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js no esta instalado
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo npm no esta instalado
    pause
    exit /b 1
)

echo [1/5] Instalando dependencias...
call npm install

if not exist .env (
    echo [2/5] Creando .env desde plantilla...
    copy .env.example .env >nul

    echo.
    echo Revisa el archivo .env antes de usar la aplicacion.
    echo.
)

echo [3/5] Compilando proyecto...
call npm run build

echo [4/5] Reiniciando PM2...
call npx pm2 delete fake-early-bird >nul 2>nul

echo [5/5] Iniciando aplicacion...
call npx pm2 start ecosystem.config.cjs

echo.
echo Instalacion completada.
pause