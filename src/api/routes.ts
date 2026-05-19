import { Router } from "express";

import { sendManualMessage } from "../whatsapp/sender.js";

export const apiRouter = Router();

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