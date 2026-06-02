# Fake Early Bird

Aplicación local para programar mensajes automáticos de WhatsApp utilizando WhatsApp Web.

El objetivo del proyecto es ofrecer una herramienta sencilla para automatizar envíos programados, gestionar contactos y monitorizar entregas desde un dashboard local.

---

# Stack tecnológico

- Node.js
- TypeScript
- Express.js
- SQLite
- better-sqlite3
- whatsapp-web.js
- Puppeteer
- Nodemailer
- QRCode
- HTML/CSS/JavaScript
- Docker
- Vitest
- PM2
- Pino

---

# Instalación

## 1. Clonar repositorio

```bash
git clone https://github.com/mardev-es/Fake-Early-Bird.git
```

---

## 2. Entrar al proyecto

```bash
cd Fake-Early-Bird
```

---

## 3. Instalar dependencias

```bash
npm install
```

---

## 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:

```txt
http://localhost:3000
```

---

# Desarrollo con Docker

El contenedor instala automáticamente Google Chrome para Puppeteer durante la construcción de la imagen, por lo que no es necesario instalar navegadores manualmente en el host

## Ejecutar entorno de desarrollo

```bash
docker compose -f docker-compose.dev.yml up -d
```

---

## Reconstruir contenedor

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## Detener entorno Docker

```bash
docker compose -f docker-compose.dev.yml down
```

---

# Scripts disponibles

| Script | Descripción |
|---|---|
| npm run dev | Ejecuta el proyecto en desarrollo |
| npm run build | Compila TypeScript |
| npm run start | Ejecuta versión compilada |
| npm run test | Ejecuta los tests con Vitest |
| npm run lint | Ejecuta ESLint |
| npm run format | Formatea el código |

---

# Ejecución con PM2

Compilar el proyecto:

```bash
npm run build
```

Iniciar con PM2:

```bash
npx pm2 start ecosystem.config.cjs
```

Ver estado:

```bash
npx pm2 list
```

Ver logs:

```bash
npx pm2 logs fake-early-bird
```

Reiniciar:

```bash
npx pm2 restart fake-early-bird
```

Detener:

```bash
npx pm2 stop fake-early-bird
```

Eliminar del gestor:

```bash
npx pm2 delete fake-early-bird
```

---


# Dashboard

El dashboard local permite:

- Ver estado de WhatsApp
- Ver estado SMTP
- Escanear QR
- Programar mensajes
- Ver mensajes pendientes
- Ver historial de envíos
- Ver logs en tiempo real
- Gestionar contactos

---

# Gestión de contactos

El sistema de contactos incluye:

- CRUD completo
- Búsqueda por nombre, número o etiquetas
- Sistema de favoritos
- Etiquetas personalizadas
- Exportación a CSV
- Exportación a JSON
- Historial de mensajes por contacto
- Importación desde CSV

---

# Sistema de emails

El proyecto utiliza Nodemailer para:
- Alertas de desconexión
- Confirmaciones de entrega
- Avisos de errores
- Retries automáticos

Los emails se envían mediante una cola independiente para evitar bloquear el scheduler principal.

---

# API disponible

## Estado de WhatsApp

```http
GET /api/whatsapp/status
```

---

## Crear mensaje programado

```http
POST /api/messages
```

Body:

```json
{
  "phone": "+34600111222",
  "message": "Mensaje de prueba",
  "scheduledAt": "2026-05-20T06:35:00.000Z"
}
```

---

## Obtener mensajes

```http
GET /api/messages
```

---

## Eliminar mensaje

```http
DELETE /api/messages/:id
```

---

## Obtener contactos

```http
GET /api/contacts
```

---

## Buscar contactos

```http
GET /api/contacts?q=iker
```

---

## Exportar contactos CSV

```http
GET /api/contacts/export/csv
```

---

## Exportar contactos JSON

```http
GET /api/contacts/export/json
```

---

## Logs en tiempo real (SSE)

```http
GET /api/logs/stream
```

## Obtener historial de un contacto

```http
GET /api/contacts/:id/messages
```

Devuelve todos los mensajes asociados al número de teléfono del contacto.
```

---

# Estado actual

## Fase 1
- [x] Setup TypeScript
- [x] ESLint + Prettier
- [x] Variables de entorno
- [x] Express.js
- [x] SQLite
- [x] Docker básico
- [x] Docker development con hot reload

## Fase 2
- [x] Integración WhatsApp Web
- [x] Persistencia de sesión
- [x] QR en consola y dashboard
- [x] Dashboard local básico
- [x] API REST básica
- [x] Envío manual de mensajes
- [x] Reconexión automática con backoff exponencial
- [x] Alertas email

## Fase 3
- [x] Instalar node-cron
- [x] Job principal: revisar mensajes scheduled cuya fecha ya pasó
- [x] Mutex/lock para evitar procesamiento simultáneo
- [x] Cola básica con SQLite
- [x] Endpoint para crear mensajes programados
- [x] Endpoint para listar mensajes programados
- [x] Horario laboral configurable
- [-] Fines de semana y festivos
- [x] Timezone
- [x] Cooldown entre mensajes consecutivos al mismo contacto
- [x] Límite anti-spam por contacto al día
- [x] Variación horaria configurable

## Fase 4 - Humanización
- [x] Delay aleatorio pre-envío
- [x] Simulación de escritura
- [x] Variación horaria ±N minutos
- [x] Cooldown entre mensajes consecutivos
- [x] Límite anti-spam configurable

## Fase 5 - Sistema de Verificación de Entrega

- [x] Suscripción al evento `message_ack`
- [x] Mapeo de niveles ACK
- [x] Registro de `whatsappMessageId` en BD
- [x] Actualización automática a `delivered` mediante ACK >= 2
- [x] Timeout configurable de entrega
- [x] Emails de confirmación de entrega
- [x] Detección de timeout de entrega
- [-] Retry automático ante fallo de ACK
- [x] Alertas por timeout de entrega
- [x] Sistema de requeue automático
- [x] Registro de ACKs fallidos

## Fase 6 - Sistema SMTP y Emails

- [x] Integración con Nodemailer
- [x] Verificación SMTP al arrancar
- [x] Cola de emails independiente
- [x] Sistema de retries con backoff
- [x] Templates HTML
- [x] Registro de logs de email
- [x] Emails de desconexión WhatsApp
- [x] Emails de entrega exitosa
- [x] Emails de reintentos agotados

## Fase 7 - Base de Datos y Persistencia

- [x] Repositories CRUD
- [x] Migraciones versionadas
- [x] Backups automáticos SQLite
- [x] Persistencia de contactos
- [x] Persistencia de ACKs
- [x] Persistencia de logs SMTP

## Fase 8 - Dashboard Localhost

- [x] Middleware localhost-only
- [x] Dashboard local
- [x] Estado WhatsApp y SMTP
- [x] Lista de mensajes pendientes
- [x] Historial de mensajes enviados
- [x] Programación de mensajes
- [x] Logs en tiempo real (SSE)
- [x] Estadísticas básicas
- [x] Gestión visual de contactos

## Fase 9 - Gestión de Contactos

- [x] CRUD de contactos desde dashboard
- [x] Búsqueda por nombre o número
- [x] Sistema de favoritos y etiquetas
- [x] Exportación a CSV/JSON
- [x] Historial de mensajes por contacto
- [x] Importación desde CSV

## Fase 10 - Seguridad

- [x] Middleware Express: rechazar peticiones que no vengan de `127.0.0.1`
- [x] Validar y sanitizar todos los inputs de la API
- [x] `.env` en `.gitignore` (y también sesión WA y BD)
- [x] Logs sanitizados: nunca loggear passwords, tokens ni contenido de mensajes en producción
- [x] Manejo de errores global (Express error handler + proceso `uncaughtException`)

## Fase 11 - Calidad y Resiliencia

- [x] Tests unitarios para: scheduler, cola, email module, ACK watcher
- [x] Tests de integración para flujo completo (mock de whatsapp-web.js)
- [x] Recovery tras crash: al reiniciar, retomar mensajes en estado `sending`
- [x] Logs estructurados con `pino`
- [x] Optimización RAM: modo headless Puppeteer y limitación de concurrencia

## Fase 12 - Deployment

- [x] Configuración PM2 (`ecosystem.config.cjs`) con restart automático
- [ ] Script `install.sh` (instala deps, crea `.env` de ejemplo, inicia PM2)
- [x] Dockerfile opcional (Node + Chromium para Puppeteer)
- [x] `docker-compose.yml` opcional con volúmenes para sesión y BD
- [x] `README.md` con guía de instalación y primer QR scan
- [ ] Configuración de inicio al arrancar sistema (systemd / Windows Task Scheduler)