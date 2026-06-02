#!/bin/bash

set -e

echo "=================================="
echo " Fake Early Bird Installer"
echo "=================================="

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js no está instalado"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "npm no está instalado"
    exit 1
fi

echo "[1/5] Instalando dependencias..."
npm install

if [ ! -f .env ]; then
    echo "[2/5] Creando .env desde plantilla..."
    cp .env.example .env

    echo ""
    echo "Revisa el archivo .env antes de usar la aplicación."
    echo ""
fi

echo "[3/5] Compilando proyecto..."
npm run build

echo "[4/5] Reiniciando PM2..."
npx pm2 delete fake-early-bird >/dev/null 2>&1 || true

echo "[5/5] Iniciando aplicación..."
npx pm2 start ecosystem.config.cjs

echo ""
echo "Instalación completada."