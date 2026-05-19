import { Router } from "express";

import { getWhatsAppStatus } from "../whatsapp/client.js";
import { sendManualMessage } from "../whatsapp/sender.js";

export const apiRouter = Router();

/**
 * Envía un mensaje manual de prueba desde el dashboard/API
 *
 * Este endpoint es TEMPORAL y sirve para comprobar que WhatsApp Web
 * puede enviar mensajes correctamente antes de implementar el scheduler
 */
apiRouter.post("/messages/test-send", async (req, res) => {
    const { phone, message } = req.body ?? {};

    if (!phone || !message) {
        res.status(400).json({
            error: "phone y message son obligatorios",
        });
        return;
    }

    try {
        await sendManualMessage(phone, message);

        res.json({
            status: "sent",
        });
    } catch (error) {
        console.error("Error enviando mensaje:", error);

        res.status(500).json({
            error: "No se pudo enviar el mensaje",
        });
    }
});

/**
 * Devuelve el estado actual del cliente de WhatsApp.
 *
 * También puede devolver el QR en formato Data URL cuando la sesión
 * todavía no está autenticada.
 */
apiRouter.get("/whatsapp/status", (_req, res) => {
    res.json(getWhatsAppStatus());
});