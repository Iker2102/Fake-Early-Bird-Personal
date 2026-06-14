import { Router } from "express";
import type { Request, Response } from "express";

import { getWhatsAppStatus } from "../whatsapp/client.js";
import { sendManualMessage } from "../whatsapp/sender.js";

import {
    createScheduledMessage,
    deleteScheduledMessage,
    findMessagesByPhone,
    findScheduledMessages,
    getMessageStatsForToday,
} from "../db/repositories/scheduledMessageRepository.js";

import {
    createContact,
    deleteContact,
    findContactById,
    findContacts,
    searchContacts,
    updateContact,
} from "../db/repositories/contactRepository.js";

import {
    countSentEmailsToday,
    findEmailLogs,
} from "../db/repositories/emailLogRepository.js";

import {
    ValidationError,
    validateMessage,
    validateOptionalText,
    validatePhone,
    validatePriority,
    validateRequiredText,
    validateScheduledAt,
} from "../shared/validators.js";

import { streamLogs } from "./logStream.js";
import { logWarn } from "../shared/logger.js";

import {
    getEditableSettings,
    updateEditableSettings,
} from "../config/settingsRepository.js";

import {
    getDevices,
    initializeDevice,
} from "../whatsapp/deviceManager.js";

export const apiRouter = Router();

function handleValidationError(error: unknown, res: Response): boolean {
    if (error instanceof ValidationError) {
        res.status(400).json({
            error: error.message,
        });

        return true;
    }

    return false;
}

/**
 * Envía un mensaje manual de prueba desde el dashboard/API.
 */
apiRouter.post("/messages/test-send", async (req, res) => {
    try {
        const phone = validatePhone(req.body.phone);
        const message = validateMessage(req.body.message);

        await sendManualMessage("default", phone, message);

        res.json({
            status: "sent",
        });
    } catch (error) {
        if (handleValidationError(error, res)) {
            return;
        }

        console.error("Error enviando mensaje:", error);

        res.status(500).json({
            error: "No se pudo enviar el mensaje",
        });
    }
});

/**
 * Devuelve el estado actual del cliente de WhatsApp.
 */
apiRouter.get("/whatsapp/status", (_req, res) => {
    res.json(getWhatsAppStatus());
});

/**
 * Crea un mensaje programado y lo guarda en la cola.
 */
apiRouter.post("/messages", (req, res) => {
    try {
        const scheduledMessage = createScheduledMessage({
            phone: validatePhone(req.body.phone),
            contactName: validateOptionalText(req.body.contactName, "contactName", 100),
            message: validateMessage(req.body.message),
            scheduledAt: validateScheduledAt(req.body.scheduledAt),
            recurrence: req.body.recurrence ?? "none",
            recurrenceInterval: Number(req.body.recurrenceInterval ?? 1),
        });

        res.status(201).json(scheduledMessage);
    } catch (error) {
        if (handleValidationError(error, res)) {
            return;
        }

        res.status(500).json({
            error: "No se pudo crear el mensaje programado",
        });
    }
});

/**
 * Lista todos los mensajes programados.
 */
apiRouter.get("/messages", (_req, res) => {
    res.json(findScheduledMessages());
});

/**
 * Elimina un mensaje programado por ID.
 */
apiRouter.delete("/messages/:id", (req, res) => {
    deleteScheduledMessage(req.params.id);

    res.json({
        status: "deleted",
    });
});

/**
 * Lista los logs de email.
 */
apiRouter.get("/logs", (_req, res) => {
    res.json(findEmailLogs());
});

/**
 * Devuelve estadísticas generales del sistema para el dashboard.
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
 * Stream SSE para enviar logs en tiempo real al dashboard.
 */
apiRouter.get("/logs/stream", (_req, res) => {
    streamLogs(res);
});

/**
 * Obtiene todos los contactos o filtra por búsqueda.
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
 * Exporta los contactos filtrados en formato JSON.
 *
 * IMPORTANTE: esta ruta debe ir antes de /contacts/:id.
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
 * Exporta los contactos filtrados en formato CSV.
 *
 * IMPORTANTE: esta ruta debe ir antes de /contacts/:id.
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
 * Obtiene un contacto específico por ID.
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
 * Obtiene el historial de mensajes de un contacto.
 */
apiRouter.get("/contacts/:id/messages", (req, res) => {
    const contact = findContactById(req.params.id);

    if (!contact) {
        res.status(404).json({ error: "Contacto no encontrado" });
        return;
    }

    res.json(findMessagesByPhone(contact.phone));
});

/**
 * Crea un nuevo contacto.
 */
apiRouter.post("/contacts", (req, res) => {
    try {
        const contact = createContact({
            name: validateRequiredText(req.body.name, "name", 100),
            phone: validatePhone(req.body.phone),
            tags: validateOptionalText(req.body.tags, "tags", 300),
            priority: validatePriority(req.body.priority),
        });

        res.status(201).json(contact);
    } catch (error) {
        if (handleValidationError(error, res)) {
            return;
        }

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
 * Actualiza parcialmente un contacto existente.
 */
apiRouter.put("/contacts/:id", (req, res) => {
    try {
        updateContact(req.params.id, {
            name: req.body.name === undefined
                ? undefined
                : validateRequiredText(req.body.name, "name", 100),

            phone: req.body.phone === undefined
                ? undefined
                : validatePhone(req.body.phone),

            tags: req.body.tags === undefined
                ? undefined
                : validateOptionalText(req.body.tags, "tags", 300),

            priority: req.body.priority === undefined
                ? undefined
                : validatePriority(req.body.priority),
        });

        res.json({ status: "updated" });
    } catch (error) {
        if (handleValidationError(error, res)) {
            return;
        }

        res.status(500).json({
            error: "No se pudo actualizar el contacto",
        });
    }
});

/**
 * Elimina un contacto por ID.
 */
apiRouter.delete("/contacts/:id", (req, res) => {
    deleteContact(req.params.id);

    res.json({ status: "deleted" });
});

/**
 * Obtiene contactos aplicando filtros opcionales.
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

/**
 * Exporta todo a formato JSON
 */
apiRouter.get("/export/full", (_req, res) => {
    const data = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        contacts: findContacts(),
        messages: findScheduledMessages(),
        emailLogs: findEmailLogs(),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=fake-early-bird-export.json"
    );

    res.send(JSON.stringify(data, null, 2));
});


/**
 * Imorta todo el contenido
 */
apiRouter.post("/import/full", (req, res) => {
    const data = req.body;

    if (!data || data.version !== "1.0") {
        res.status(400).json({
            error: "Archivo de importación no válido",
        });
        return;
    }

    let contactsImported = 0;
    let messagesImported = 0;

    for (const contact of data.contacts ?? []) {
        try {
            createContact({
                name: contact.name,
                phone: contact.phone,
                tags: contact.tags ?? null,
                priority: contact.priority ?? "normal",
            });

            contactsImported++;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            if (!message.includes("UNIQUE")) {
             throw error;
            }
        }
    }

    for (const contact of data.contacts ?? []) {
        try {
            createContact({
                name: contact.name,
                phone: contact.phone,
                tags: contact.tags ?? null,
                priority: contact.priority ?? "normal",
            });

            contactsImported++;
        } catch (error) {
            logWarn(`Contacto omitido durante importación: ${contact.phone}`);
        }
    }

    res.json({
        status: "imported",
        contactsImported,
        messagesImported,
    });
});


apiRouter.get("/settings", (_req, res) => {
    res.json(getEditableSettings());
});

apiRouter.put("/settings", (req, res) => {
    try {
        updateEditableSettings(req.body ?? {});

        res.json({
            status: "updated",
            restartRequired: true,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        res.status(400).json({
            error: message,
        });
    }
});

apiRouter.get("/devices", (_req, res) => {
    res.json(
        getDevices().map((device) => ({
            id: device.id,
            name: device.name,
            status: device.status,
            qr: device.qr,
            isReady: device.isReady,
        }))
    );
});

apiRouter.post("/devices/:id/start", async (req, res) => {
    const deviceName = req.body?.name ?? req.params.id;

    await initializeDevice(req.params.id, deviceName);

    res.json({
        status: "initializing",
    });
});