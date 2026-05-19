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

# Estado actual

## Fase 1
- [x] Setup TypeScript
- [x] Configuración ESLint + Prettier
- [x] Configuración variables de entorno
- [x] Servidor Express base
- [x] Configuración SQLite inicial
- [x] Schema de tablas inicial
