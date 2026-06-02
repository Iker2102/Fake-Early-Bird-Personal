# 🚀 Deployment

Guía de despliegue y ejecución de Fake Early Bird.

---

# 📋 Requisitos

| Requisito | Obligatorio |
|------------|------------|
| Node.js 22+ | ✅ |
| npm | ✅ |
| Google Chrome / Chromium | ✅ |
| WhatsApp Web | ✅ |
| SMTP | ⚠️ Opcional |

---

# ⚙️ Compilación

| Acción | Comando |
|----------|----------|
| Compilar proyecto | `npm run build` |
| Ejecutar tests | `npm run test` |
| Formatear código | `npm run format` |
| Ejecutar lint | `npm run lint` |

Salida generada:

```txt
dist/
```

---

# 🔄 PM2

Archivo utilizado:

```txt
ecosystem.config.cjs
```

## Comandos principales

| Acción | Comando |
|----------|----------|
| Iniciar | `npx pm2 start ecosystem.config.cjs` |
| Ver procesos | `npx pm2 list` |
| Ver logs | `npx pm2 logs fake-early-bird` |
| Reiniciar | `npx pm2 restart fake-early-bird` |
| Detener | `npx pm2 stop fake-early-bird` |
| Eliminar | `npx pm2 delete fake-early-bird` |
| Guardar configuración | `npx pm2 save` |

---

# 📦 Instalación Automática

| Sistema | Comando |
|----------|----------|
| Linux | `./install.sh` |
| Windows | `install.bat` |

---

# 🐳 Docker

## Comandos principales

| Acción | Comando |
|----------|----------|
| Construir imagen | `docker compose build` |
| Iniciar | `docker compose up -d` |
| Ver logs | `docker compose logs -f` |
| Detener | `docker compose down` |

---

# 🔥 Inicio Automático

## Linux (systemd)

Crear:

```txt
/etc/systemd/system/fake-early-bird.service
```

### Servicio

```ini
[Unit]
Description=Fake Early Bird
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/fake-early-bird
ExecStart=/usr/bin/node /opt/fake-early-bird/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Activación

| Acción | Comando |
|----------|----------|
| Recargar systemd | `sudo systemctl daemon-reload` |
| Habilitar inicio automático | `sudo systemctl enable fake-early-bird` |
| Iniciar servicio | `sudo systemctl start fake-early-bird` |
| Ver estado | `sudo systemctl status fake-early-bird` |

---

## Windows (Task Scheduler)

### Configuración recomendada

| Campo | Valor |
|---------|---------|
| Trigger | At startup / At log on |
| Acción | Start a program |
| Programa | `npx` |
| Argumentos | `pm2 resurrect` |

---

# 🔐 Variables de Entorno

La aplicación utiliza:

```txt
.env
```

Plantilla incluida:

```txt
.env.example
```

---

# 🔄 Actualización

| Acción | Comando |
|----------|----------|
| Actualizar dependencias | `npm install` |
| Compilar | `npm run build` |
| Reiniciar PM2 | `npx pm2 restart fake-early-bird` |

---

# 💾 Backups

## Directorios importantes

| Directorio | Contenido |
|------------|------------|
| `data/` | Base de datos SQLite |
| `.wwebjs_auth/` | Sesión de WhatsApp |
| `.wwebjs_cache/` | Caché de WhatsApp |
| `logs/` | Logs de aplicación |

## Recomendación

Realizar copias periódicas de todos los directorios anteriores para evitar pérdida de datos.

---

# 📚 Documentación Relacionada

| Documento | Descripción |
|------------|------------|
| [README](../README.md) | Guía principal del proyecto |
| [Roadmap](./Feature-checklist.md) | Estado y progreso de desarrollo |
| [Deployment](./DEPLOYMENT.md) | Guía de despliegue |