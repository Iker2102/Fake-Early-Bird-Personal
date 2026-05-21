# Fake Early Bird

Aplicación local para programar mensajes automáticos de WhatsApp utilizando automatización de WhatsApp Web.

El sistema permite:
- Programar mensajes
- Gestionar contactos
- Verificar entregas mediante ACK
- Recibir alertas por email si ocurre un fallo

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
- Dashboard web local

---

# Instalación

## 1. Clonar repositorio

```bash
git clone https://github.com/Iker2102/Fake-Early-Bird.git
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

# Desarrollo con Docker

## Ejecutar entorno de desarrollo con hot reload

```bash
docker compose -f docker-compose.dev.yml up
```

La aplicación estará disponible en:

```txt
http://localhost:3000
```

---

## Reconstruir contenedor tras instalar nuevas dependencias

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## Detener entorno Docker

```bash
docker compose -f docker-compose.dev.yml down
```

---

## Notas

- Los cambios en el código se reflejan automáticamente gracias a los volúmenes Docker.
- No es necesario reconstruir el contenedor al modificar archivos TypeScript, HTML, CSS o JavaScript.
- Solo es necesario reconstruir la imagen al instalar nuevas dependencias o modificar el Dockerfile.




---


## 6. Abrir dashboard

```txt
http://localhost:3000
```

---

# Scripts disponibles

| Script | Descripción |
|---|---|
| npm run dev | Ejecuta el proyecto en desarrollo |
| npm run build | Compila TypeScript |
| npm run start | Ejecuta versión compilada |
| npm run lint | Ejecuta ESLint |
| npm run format | Formatea el código |

---

# API disponible

## Estado de WhatsApp

```http
GET /api/whatsapp/status
```

Devuelve:
- estado actual del cliente
- QR activo si existe

---

## Enviar mensaje manual de prueba

```http
POST /api/messages/test-send
```

Body:

```json
{
  "phone": "+34600111222",
  "message": "Mensaje de prueba"
}
```


```http
POST /api/messages
```

```json
{
  "phone": "+34600111222",
  "message": "Mensaje de prueba",
  "scheduledAt": "2026-05-20T06:35:00.000Z"
}
```


## Listar mensajes programados

```http
GET /api/messages
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
- [ ] Prevención avanzada de duplicados

## Fase 4 - Humanización
- [x] Delay aleatorio pre-envío
- [x] Simulación de escritura
- [x] Variación horaria ±N minutos
- [x] Cooldown entre mensajes consecutivos
- [x] Límite anti-spam configurable

## Fase 5 - Sistema de Verificación de Entrega
- [x] Suscripción al evento `message_ack`
- [-] Mapeo de niveles ACK
- [x] Registro de `whatsappMessageId` en BD
- [-] Actualización automática a `delivered` mediante ACK >= 2
- [ ] Timeout configurable de entrega
- [ ] Emails de confirmación de entrega
- [ ] Detección de timeout de entrega
- [ ] Retry automático ante fallo de ACK