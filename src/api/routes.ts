import { Router } from "express";

import { getWhatsAppStatus } from "../whatsapp/client.js";
import { sendManualMessage } from "../whatsapp/sender.js";
import { createScheduledMessage, findScheduledMessages, } from "../db/repositories/scheduledMessageRepository.js";

import { findContacts } from "../db/repositories/contactRepository.js"
import { findEmailLogs } from "../db/repositories/emailLogRepository.js"

import { deleteScheduledMessage } from "../db/repositories/scheduledMessageRepository.js";

import { getMessageStatsForToday } from "../db/repositories/scheduledMessageRepository.js";
import { countSentEmailsToday } from "../db/repositories/emailLogRepository.js";


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

/**
 * Crea un mensaje programado y lo guarda en la cola
 */
apiRouter.post("/messages", (req, res) => {
    const { phone, contactName, message, scheduledAt } = req.body ?? {};

    if (!phone || !message || !scheduledAt) {
        res.status(400).json({
            error: "phone, message y scheduledAt son obligatorios",
        });
        return;
    }

    const scheduledMessage = createScheduledMessage({
        phone,
        contactName,
        message,
        scheduledAt,
    });

    res.status(201).json(scheduledMessage);
});

/**
 * Lista todos los mensajes programados
 */
apiRouter.get("/messages", (_req, res) => {
    res.json(findScheduledMessages());
});

/**
 * Lista los contactos
 */
apiRouter.get("/contacts", (_req, res) => {
    res.json(findContacts());
});


/**
 * Lista los logs
 */
apiRouter.get("/logs", (_req, res) => {
    res.json(findEmailLogs());
});



/**
 * Elimina a partir de una id
 */
apiRouter.delete("/messages/:id", (req, res) => {
    deleteScheduledMessage(req.params.id);


    res.json({
        status: "deleted",
    });
});


apiRouter.get("/stats", (_req, res) => {
    const now = new Date();

    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const messageStats = getMessageStatsForToday(
        dayStart.toISOString(),
        dayEnd.toISOString()
    );

    const emailsSentToday = countSentEmailsToday(
        dayStart.toISOString(),
        dayEnd.toISOString()
    );

    const deliveryRate =
        messageStats.sentToday === 0
            ? 0
            : Math.round((messageStats.deliveredToday / messageStats.sentToday) * 100);

    res.json({
        ...messageStats,
        deliveryRate,
        emailsSentToday,
    });
});