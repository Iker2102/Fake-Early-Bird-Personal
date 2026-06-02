# Fake Early Bird

Aplicación local para programar mensajes automáticos de WhatsApp utilizando WhatsApp Web.

El objetivo del proyecto es ofrecer una herramienta sencilla para automatizar envíos programados, gestionar contactos y monitorizar entregas desde un dashboard local.

---

# Stack Tecnológico

| Backend | Infraestructura | Testing y Calidad |
|----------|----------|----------|
| Node.js | Docker | Vitest |
| TypeScript | PM2 | Pino |
| Express.js | Puppeteer | ESLint |
| SQLite | whatsapp-web.js | Prettier |
| better-sqlite3 | Nodemailer | |

---

# Instalación

## 1. Clonar repositorio

```bash
git clone https://github.com/mardev-es/Fake-Early-Bird.git
```

## 2. Entrar al proyecto

```bash
cd Fake-Early-Bird
```

## 3. Instalar dependencias

```bash
npm install
```

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

El contenedor instala automáticamente Google Chrome para Puppeteer durante la construcción de la imagen.

## Ejecutar entorno de desarrollo

```bash
docker compose -f docker-compose.dev.yml up -d
```

## Reconstruir contenedor

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Detener entorno

```bash
docker compose -f docker-compose.dev.yml down
```

---

# Scripts Disponibles

| Script | Descripción |
|----------|----------|
| npm run dev | Ejecuta el proyecto en desarrollo |
| npm run build | Compila TypeScript |
| npm run start | Ejecuta versión compilada |
| npm run test | Ejecuta todos los tests |
| npm run lint | Ejecuta ESLint |
| npm run format | Formatea el código |

---

# Dashboard

El dashboard local permite:

| Funcionalidad | Estado |
|----------|----------|
| Estado de WhatsApp | ✅ |
| Estado SMTP | ✅ |
| Escaneo QR | ✅ |
| Programación de mensajes | ✅ |
| Historial de envíos | ✅ |
| Logs en tiempo real (SSE) | ✅ |
| Estadísticas | ✅ |
| Gestión de contactos | ✅ |

---

# Gestión de Contactos

| Funcionalidad | Estado |
|----------|----------|
| CRUD completo | ✅ |
| Búsqueda por nombre o número | ✅ |
| Sistema de favoritos | ✅ |
| Etiquetas personalizadas | ✅ |
| Exportación CSV | ✅ |
| Exportación JSON | ✅ |
| Historial por contacto | ✅ |
| Importación CSV | ✅ |

---

# Sistema de Emails

El proyecto utiliza Nodemailer para:

- Alertas de desconexión
- Confirmaciones de entrega
- Avisos de errores
- Retries automáticos

Los emails se procesan mediante una cola independiente para evitar bloquear el scheduler principal.

---

# Testing

El proyecto incluye:

- Tests unitarios
- Tests de integración
- Mocking de WhatsApp Web
- Validación de scheduler
- Validación de ACK watcher
- Validación de cola de emails

Ejecutar:

```bash
npm run test
```

---

# API Disponible

## Estado de WhatsApp

```http
GET /api/whatsapp/status
```

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

## Obtener mensajes

```http
GET /api/messages
```

## Eliminar mensaje

```http
DELETE /api/messages/:id
```

## Obtener contactos

```http
GET /api/contacts
```

## Buscar contactos

```http
GET /api/contacts?q=iker
```

## Exportar contactos CSV

```http
GET /api/contacts/export/csv
```

## Exportar contactos JSON

```http
GET /api/contacts/export/json
```

## Historial de mensajes de un contacto

```http
GET /api/contacts/:id/messages
```

## Logs en tiempo real (SSE)

```http
GET /api/logs/stream
```

---

# Estado del Proyecto

| Área | Estado |
|----------|----------|
| Setup y Arquitectura | ✅ |
| Integración WhatsApp | ✅ |
| Scheduler | ✅ |
| Humanización | ✅ |
| Sistema de Entregas (ACK) | ⚠️ |
| SMTP y Emails | ✅ |
| Persistencia y Backups | ✅ |
| Dashboard Local | ✅ |
| Gestión de Contactos | ✅ |
| Seguridad | ✅ |
| Calidad y Resiliencia | ✅ |
| Deployment | ⚠️ |

---

# Documentación Adicional

- [Deployment](docs/DEPLOYMENT.md)
- [Roadmap](docs/Feature-checklist.md)
