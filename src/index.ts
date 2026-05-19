import express from "express";

import { env } from "./config/env.js";
import { initializeDatabase } from "./db/schema.js";
import { destroyWhatsAppClient, initializeWhatsAppClient } from "./whatsapp/client.js";
import { apiRouter } from "./api/routes.js";

const app = express();

/**
 * Inicia la base de datos SQLite y crea el schema
 */
initializeDatabase();

/**
 * Inicia el cliente de WhatsApp
 */

await initializeWhatsAppClient();

process.on("SIGINT", async () => {
    console.log("Cerrando aplicación...");
    await destroyWhatsAppClient();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("Cerrando aplicación...");
    await destroyWhatsAppClient();
    process.exit(0);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
});


app.use(express.json());
app.use("/api", apiRouter);

/**
 * Endpoint para comprobar el estado de la aplicación
 */
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

/**
 * Inicia el servidor Express con el puerto configurado
 */
app.listen(env.PORT, () => {
    console.log(`Fake Early Bird running on port ${env.PORT}`);
});