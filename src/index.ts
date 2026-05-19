import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { apiRouter } from "./api/routes.js";
import { env } from "./config/env.js";
import { initializeDatabase } from "./db/schema.js";
import { destroyWhatsAppClient, initializeWhatsAppClient } from "./whatsapp/client.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Inicializa la base de datos SQLite y crea las tablas necesarias
 */
initializeDatabase();

/**
 * Inicializa el cliente de WhatsApp Web
 */
await initializeWhatsAppClient();

/**
 * Permite recibir peticiones JSON en la API
 */
app.use(express.json());

/**
 * Registra las rutas principales de la API
 */
app.use("/api", apiRouter);

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
        message.includes("Execution context was destroyed")
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
    console.error("Uncaught exception:", error);
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