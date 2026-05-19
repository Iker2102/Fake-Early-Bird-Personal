# Fake Early Bird - Development Checklist (v2)

## Fase 1 - Setup Base

- [x] Definir arquitectura general
- [x] Elegir stack tecnológico
- [x] Inicializar proyecto Node.js + TypeScript
- [x] Configurar ESLint + Prettier
- [x] Crear estructura de carpetas (`src/whatsapp`, `src/scheduler`, `src/email`, `src/db`, `src/api`, `src/dashboard`)
- [x] Configurar y validar variables de entorno (fail-fast al arrancar)
- [x] Configurar SQLite con `better-sqlite3`
- [x] Crear schema inicial de BD (tablas `scheduled_messages`, `contacts`, `email_logs`)

---

## Fase 2 - Integración WhatsApp

- [ ] Instalar `whatsapp-web.js` + Puppeteer
- [ ] Inicializar cliente con sesión persistente (`.wwebjs_auth/`)
- [ ] Generar y mostrar QR en consola y dashboard
- [ ] Detectar estado: `qr`, `ready`, `authenticated`, `disconnected`
- [ ] Implementar reconexión automática con backoff exponencial
- [ ] Disparar email de alerta si se detecta `auth_failure` o `disconnected` con mensajes en cola
- [ ] Probar envío manual simple a número de prueba

---

## Fase 3 - Scheduler y Cola

- [ ] Instalar `node-cron`
- [ ] Job principal: cada minuto revisa mensajes en estado `scheduled` cuya `scheduledAt` ya pasó
- [ ] Mutex/lock para evitar procesamiento simultáneo
- [ ] Respetar horario laboral configurable (`WORK_HOURS_START/END`)
- [ ] Detectar fin de semana y festivos → reprogramar al siguiente día hábil
- [ ] Manejo de timezone (configurar con `TZ` en `.env`)
- [ ] Prevención de duplicados por ID único antes de encolar

---

## Fase 4 - Envío con Humanización

- [ ] Delay aleatorio pre-envío (`RANDOM_DELAY_MIN/MAX_SECONDS`)
- [ ] Simular escritura (`sendPresenceUpdate('composing')` + pausa proporcional al texto)
- [ ] Variación horaria ±N minutos (configurable)
- [ ] Cooldown entre mensajes consecutivos al mismo contacto
- [ ] Límite anti-spam: máx. mensajes por contacto por día

---

## Fase 5 - Sistema de Verificación de Entrega ⭐ NUEVO

- [ ] Suscribirse al evento `message_ack` de whatsapp-web.js
- [ ] Mapear niveles ACK: `0=pending, 1=server, 2=device, 3=read, 4=played`
- [ ] Al enviar, registrar `messageId` de WhatsApp en BD para correlacionar el ACK
- [ ] Iniciar temporizador de `DELIVERY_TIMEOUT_MINUTES` tras el envío
- [ ] Si llega `ACK_DEVICE (2)` o superior dentro del timeout:
  - [ ] Actualizar BD: `status=delivered`, `deliveredAt`, `ackLevel`
  - [ ] Enviar email de confirmación si `NOTIFY_ON_SUCCESS=true`
- [ ] Si expira el timeout sin `ACK_DEVICE`:
  - [ ] Actualizar BD: `status=delivery_failed`, `failReason=timeout`
  - [ ] Disparar email de alerta inmediatamente
- [ ] Si `message_ack` devuelve error explícito:
  - [ ] Actualizar BD: `status=failed`, `failReason=<error>`
  - [ ] Disparar retry si `retryCount < RETRY_MAX`, si no → email de alerta

---

## Fase 6 - Módulo de Email (Nodemailer + SMTP) ⭐ NUEVO

- [ ] Instalar `nodemailer` + `@types/nodemailer`
- [ ] Configurar transporte SMTP con credenciales de `.env` (`smtp.mardev.es`)
- [ ] Test de conexión SMTP al arrancar (`transporter.verify()`) con log de resultado
- [ ] Implementar cola de emails independiente (no bloquea scheduler principal)
- [ ] Retry de emails fallidos (3 intentos, backoff 1min/5min/15min)
- [ ] Registrar cada intento de email en tabla `email_logs`

### Templates HTML a implementar

- [ ] `delivery_failure.html` — alerta roja: mensaje fallido, contacto, motivo, sugerencia
- [ ] `delivery_success.html` — confirmación verde: contacto, extracto, timestamp ACK
- [ ] `whatsapp_disconnected.html` — aviso naranja: sesión perdida, N mensajes en cola
- [ ] `retry_exhausted.html` — alerta crítica: reintentos agotados, acción manual requerida
- [ ] `daily_summary.html` — resumen diario: enviados, entregados, fallidos, tasa de éxito

---

## Fase 7 - Base de Datos

- [ ] Tabla `scheduled_messages` con todos los campos del schema v2
- [ ] Tabla `contacts` (id, name, phone, tags, priority, lastInteraction)
- [ ] Tabla `email_logs` (id, messageId, type, sentAt, success, error)
- [ ] Repositories: CRUD para cada entidad
- [ ] Migraciones versionadas (archivo `migrations/`)
- [ ] Backup automático diario (copiar `.db` → `.db.bak` con timestamp)

---

## Fase 8 - Dashboard Localhost

- [ ] Configurar Express con middleware de restricción a localhost
- [ ] Endpoint REST básico: GET/POST/DELETE mensajes, GET contactos, GET logs
- [ ] Homepage con estado WhatsApp + estado SMTP
- [ ] Lista de mensajes pendientes con estado visual (colores por status)
- [ ] Historial de enviados con columna `Entregado` y nivel ACK
- [ ] Formulario de programación de nuevo mensaje
- [ ] Panel de logs en tiempo real (SSE: `GET /api/logs/stream`)
- [ ] Estadísticas: enviados hoy, tasa de entrega, emails enviados

---

## Fase 9 - Gestión de Contactos

- [ ] CRUD de contactos desde dashboard
- [ ] Búsqueda por nombre o número
- [ ] Sistema de favoritos y etiquetas
- [ ] Historial de mensajes por contacto
- [ ] Importación desde CSV
- [ ] Exportación a CSV/JSON

---

## Fase 10 - Seguridad

- [ ] Middleware Express: rechazar peticiones que no vengan de `127.0.0.1`
- [ ] Validar y sanitizar todos los inputs de la API
- [ ] `.env` en `.gitignore` (y también sesión WA y BD)
- [ ] Logs sanitizados: nunca loggear passwords, tokens ni contenido de mensajes en producción
- [ ] Manejo de errores global (Express error handler + proceso `uncaughtException`)

---

## Fase 11 - Calidad y Resiliencia

- [ ] Tests unitarios para: scheduler, cola, email module, ACK watcher
- [ ] Tests de integración para flujo completo (mock de whatsapp-web.js)
- [ ] Recovery tras crash: al reiniciar, retomar mensajes en estado `sending` (marcar como `failed` y reencolar)
- [ ] Logs estructurados con `pino` o `winston` (nivel configurable)
- [ ] Optimización RAM: modo headless Puppeteer, limitar concurrencia

---

## Fase 12 - Deployment

- [ ] Configuración PM2 (`ecosystem.config.js`) con restart automático
- [ ] Script `install.sh` (instala deps, crea `.env` de ejemplo, inicia PM2)
- [ ] Dockerfile opcional (Node + Chromium para Puppeteer)
- [ ] `docker-compose.yml` opcional con volúmenes para sesión y BD
- [ ] `README.md` con guía de instalación y primer QR scan
- [ ] Configuración de inicio al arrancar sistema (systemd / Windows Task Scheduler)

---

## Fase 13 - Extras y Pulido

- [ ] Mensajes recurrentes (diario, semanal, mensual, custom cron)
- [ ] Exportación completa a JSON (mensajes + contactos + logs)
- [ ] Importación JSON para restaurar estado
- [ ] Resumen diario por email (hora configurable)
- [ ] Página de configuración en dashboard (editar `.env` vía UI)
- [ ] Multi-device: soporte para más de un número con sesiones separadas

---

## Fase 14 - Futuro

- [ ] Integración IA para reescritura de mensajes
- [ ] Multi-cuenta con panel unificado
- [ ] Soporte Telegram (Telegraf)
- [ ] Soporte Signal (signal-cli)
- [ ] App móvil para control remoto
- [ ] Voice notes automáticas (TTS)
- [ ] Analytics avanzados con gráficas
- [ ] Webhooks salientes (n8n, Zapier, Make)

---

## Notas de implementación

### Flujo completo de un mensaje

```
1. Usuario crea mensaje → status: pending
2. Cron lo activa en horario → status: scheduled
3. Delay aleatorio humanizador
4. whatsapp-web.js envía → status: sending
5. AckWatcher espera evento message_ack
   ├── ACK_DEVICE en < 5min → status: delivered → [email opcional]
   └── Timeout o error     → status: failed/delivery_failed → EMAIL ALERTA
6. Si failed y retryCount < 3 → volver a paso 3 tras intervalo
7. Si retryCount === 3 → status: delivery_failed → EMAIL "reintentos agotados"
```

### Orden de prioridad para el email de fallo

1. `failed` (error en el envío): email inmediato
2. `delivery_failed` (enviado pero sin confirmación ACK_DEVICE): email inmediato
3. `whatsapp_disconnected` con cola no vacía: email inmediato
4. `retry_exhausted`: email inmediato con acción manual requerida
