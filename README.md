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

## 4. Configurar variables de entorno

Crear archivo `.env`:

```env
PORT=3000
DB_PATH=./data/app.db
WA_SESSION_PATH=./.wwebjs_auth
```

---

## 5. Ejecutar en desarrollo

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

---

# Estado actual

## Fase 1
- [x] Setup TypeScript
- [x] ESLint + Prettier
- [x] Variables de entorno
- [x] Express.js
- [x] SQLite

## Fase 2
- [x] Integración WhatsApp Web
- [x] Persistencia de sesión
- [x] QR en consola y dashboard
- [x] Dashboard local básico
- [x] API REST básica
- [x] Envío manual de mensajes
- [ ] Reconexión automática
- [ ] Scheduler
- [ ] Sistema ACK
- [ ] Alertas email


