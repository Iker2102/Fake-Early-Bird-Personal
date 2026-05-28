import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { apiRouter } from "./api/routes.js";
import { env } from "./config/env.js";
import { initializeDatabase } from "./db/schema.js";
import { destroyWhatsAppClient, initializeWhatsAppClient } from "./whatsapp/client.js";

import { verifyEmailTransport } from "./email/mailer.js";

import { startScheduler } from "./scheduler/cron.js";

import { startBackupScheduler } from "./scheduler/backupCron.js";

import { localOnly } from "./api/localOnly.js";

import { errorHandler } from "./api/errorHandler.js";
import { logError } from "./utils/logger.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isShuttingDown = false;

/**
 * Inicializa la base de datos SQLite y crea las tablas necesarias
 */
initializeDatabase();

await verifyEmailTransport();

/**
 * Inicializa el cliente de WhatsApp Web
 */

if (env.WA_ENABLED) {
    void initializeWhatsAppClient();
} else {
    console.log("WhatsApp desactivado por configuración");
}

/**
 * Inicializa el scheduler
 */
startScheduler();

/**
 * Inicia el scheduler del backup
 */
startBackupScheduler();

/**
 * Permite recibir peticiones JSON en la API
 */
app.use(express.json());

/**
 * Registra las rutas principales de la API
 */
app.use("/api", apiRouter);
app.use(errorHandler);

/**
 * Registra que solo se use desde local
 */
app.set("trust proxy", true);
app.use(localOnly);

/**
 * Sirve los archivos estáticos del dashboard local
 */
app.use(express.static(path.join(__dirname, "dashboard", "public")));

/**
 * Cierra recursos externos antes de apagar la aplicación manualmente
 */
process.on("SIGINT", async () => {
    console.log("Cerrando aplicación...");

    await destroyWhatsAppClient();

    process.exit(0);
});

/**
 * Cierra recursos externos cuando el sistema solicita finalizar el proceso
 */
process.on("SIGTERM", async () => {
    console.log("Cerrando aplicación...");

    await destroyWhatsAppClient();

    process.exit(0);
});

/**
 * Filtra errores conocidos de Puppeteer al cerrar o recargar WhatsApp Web
 */
process.on("unhandledRejection", (reason) => {
    const message = String(reason);

    if (
        message.includes("detached Frame") ||
        message.includes("Execution context was destroyed") ||
        message.includes("TargetCloseError") ||
        message.includes("Target closed") ||
        message.includes("Protocol error")
    ) {
        console.warn("WhatsApp Web cerró o recargó el navegador interno.");
        return;
    }

    console.error("Unhandled rejection:", reason);
});

/**
 * Captura errores no controlados para evitar cierres silenciosos
 */
process.on("uncaughtException", (error) => {
    logError("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});

/**
 * Endpoint para comprobar rápidamente que el servidor esta funcionando
 */
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

/**
 * Inicia el servidor Express en el puerto configurado
 */
app.listen(env.PORT, () => {
    console.log(`Fake Early Bird running on port ${env.PORT}`);
});


async function shutdown(): Promise<void> {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log("Cerrando aplicación...");

    await destroyWhatsAppClient();

    process.exit(0);
}

process.on("SIGINT", () => {
    void shutdown();
});

process.on("SIGTERM", () => {
    void shutdown();
});

