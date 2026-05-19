import express from "express";
import { env } from "./config/env.js";

const app = express();


/**
 * Endpoint para comprobar el estado de la aplicación, verifica rápidamente que el servidor funciona
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
