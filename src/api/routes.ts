import { Router } from "express";

import { getWhatsAppStatus } from "../whatsapp/client.js";
import { sendManualMessage } from "../whatsapp/sender.js";
import { createScheduledMessage, findScheduledMessages, } from "../db/repositories/scheduledMessageRepository.js";

import {
    createContact,
    deleteContact,
    findContactById,
    findContacts,
    searchContacts,
    updateContact,
} from "../db/repositories/contactRepository.js";import { findEmailLogs } from "../db/repositories/emailLogRepository.js"

import { deleteScheduledMessage } from "../db/repositories/scheduledMessageRepository.js";

import { getMessageStatsForToday } from "../db/repositories/scheduledMessageRepository.js";
import { countSentEmailsToday } from "../db/repositories/emailLogRepository.js";

import { streamLogs } from "./logStream.js";

import type { Request } from "express";

import { findMessagesByPhone } from "../db/repositories/scheduledMessageRepository.js";


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

/**
 * Devuelve estadísticas generales del sistema para el dashboard
 */
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

/**
 * Stream SSE para enviar logs en tiempo real al dashboard
 */
apiRouter.get("/logs/stream", (_req, res) => {
    streamLogs(res);
});


/**
 * Obtiene todos los contactos o filtra por búsqueda
 * Puede buscar por nombre, teléfono o etiquetas
 */
apiRouter.get("/contacts", (req, res) => {
    const query = String(req.query.q ?? "").trim();

    if (query) {
        res.json(searchContacts(query));
        return;
    }

    res.json(findContacts());
});


/**
 * Obtiene un contacto específico por ID
 */
apiRouter.get("/contacts/:id", (req, res) => {
    const contact = findContactById(req.params.id);

    if (!contact) {
        res.status(404).json({ error: "Contacto no encontrado" });
        return;
    }

    res.json(contact);
});

/**
 * Crea un nuevo contacto
 * Controla errores de teléfono duplicado
 */
apiRouter.post("/contacts", (req, res) => {
    try {
        const contact = createContact({
            name: req.body.name,
            phone: req.body.phone,
            tags: req.body.tags ?? null,
            priority: req.body.priority ?? "normal",
        });

        res.status(201).json(contact);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("UNIQUE constraint failed: contacts.phone")) {
            res.status(409).json({
                error: "Ya existe un contacto con ese teléfono",
            });

            return;
        }

        res.status(500).json({
            error: "No se pudo crear el contacto",
        });
    }
});

/**
 * Actualiza parcialmente un contacto existente
 */
apiRouter.put("/contacts/:id", (req, res) => {
    updateContact(req.params.id, {
        name: req.body.name,
        phone: req.body.phone,
        tags: req.body.tags,
        priority: req.body.priority,
    });

    res.json({ status: "updated" });
});

/**
 * Elimina un contacto por id
 */
apiRouter.delete("/contacts/:id", (req, res) => {
    deleteContact(req.params.id);

    res.json({ status: "deleted" });
});

/**
 * Exporta los contactos filtrados en formato JSON
 */
apiRouter.get("/contacts/export/json", (req, res) => {
    const contacts = getFilteredContacts(req);

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=contacts.json"
    );

    res.send(JSON.stringify(contacts, null, 2));
});

/**
 * Exporta los contactos filtrados en formato CSV
 */
apiRouter.get("/contacts/export/csv", (req, res) => {
    const contacts = getFilteredContacts(req);

    const header = "name,phone,tags,priority,lastInteraction";

    const rows = contacts.map((contact) =>
        [
            contact.name,
            contact.phone,
            contact.tags ?? "",
            contact.priority,
            contact.lastInteraction ?? "",
        ]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(",")
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=contacts.csv"
    );

    res.send([header, ...rows].join("\n"));
});



/**
 * Obtiene contactos aplicando filtros opcionales
 * @param req 
 * @returns 
 */
function getFilteredContacts(req: Request) {
    const query = String(req.query.q ?? "").trim();
    const onlyFavorites = req.query.favorites === "true";

    let contacts = query
        ? searchContacts(query)
        : findContacts();

    if (onlyFavorites) {
        contacts = contacts.filter(
            (contact) => contact.priority === "favorite"
        );
    }

    return contacts;
}

apiRouter.get("/contacts/:id/messages", (req, res) => {
    const contact = findContactById(req.params.id);

    if (!contact) {
        res.status(404).json({ error: "Contacto no encontrado" });
        return;
    }

    res.json(findMessagesByPhone(contact.phone));
});




