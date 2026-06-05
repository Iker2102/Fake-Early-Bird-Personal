import cron from "node-cron";
import { getCurrentDateInTimezone, isWeekend, isWithinWorkHours } from "./workTime.js";

import {
    findDueScheduledMessages,
    markMessageAsFailed,
    markMessageAsSending,
    markMessageAsSent,
} from "../db/repositories/scheduledMessageRepository.js";
import { sendManualMessage } from "../whatsapp/sender.js";

import { isClientReady } from "../whatsapp/client.js";

let isProcessingQueue = false;

import { canSendByCooldown, canSendByDailyLimit } from "./rules.js";

import { startDeliveryTimeout } from "../whatsapp/deliveryTimeout.js";
import { logInfo } from "../shared/logger.js";

import { createScheduledMessage } from "../db/repositories/scheduledMessageRepository.js";
import { getNextRecurringDate } from "./recurrence.js";

/**
 * Procesa la cola de mensajes pendientes
 * @returns 
 */
export async function processScheduledMessages(): Promise<void> {

    const currentDate = getCurrentDateInTimezone();


    if (!isClientReady()) {
        logInfo("Scheduler pausado: WhatsApp no está listo");
        return;
    }

    if (isProcessingQueue) {
        logInfo("La cola ya se está procesando");
        return;
    }

    if (isWeekend(currentDate)) {
        logInfo("Scheduler pausado: fin de semana");
        return;
    }

    if (!isWithinWorkHours(currentDate)) {
        logInfo("Scheduler pausado: fuera del horario laboral");
        return;
    }

    isProcessingQueue = true;

    try {
        const now = new Date().toISOString();
        const messages = findDueScheduledMessages(now);

        for (const message of messages) {

            if (!canSendByCooldown(message)) {
                logInfo(`Mensaje ${message.id} pausado por cooldown`);
                continue;
            }

            if (!canSendByDailyLimit(message)) {
                logInfo(`Mensaje ${message.id} pausado por límite diario`);
                continue;
            }

            try {
                markMessageAsSending(message.id);

                const whatsappMessageId = await sendManualMessage(message.phone, message.message);

                markMessageAsSent(message.id, whatsappMessageId);

                const nextScheduledAt = getNextRecurringDate(message);

                if (nextScheduledAt) {
                    createScheduledMessage({
                        phone: message.phone,
                        contactName: message.contactName,
                        message: message.message,
                        scheduledAt: nextScheduledAt,
                        recurrence: message.recurrence,
                        recurrenceInterval: message.recurrenceInterval,
                        parentMessageId: message.parentMessageId ?? message.id,
                    });
                }

                startDeliveryTimeout(whatsappMessageId);

            } catch (error) {
                const reason = error instanceof Error ? error.message : "Error desconocido";

                if (reason === "WHATSAPP_NOT_READY") {
                    logInfo("WhatsApp no está listo, el mensaje seguirá en cola");
                    continue;
                }

                markMessageAsFailed(message.id, reason);
            }
        }
    } finally {
        isProcessingQueue = false;
    }
}

/**
 * Inicia el job principal del scheduler
 */
export function startScheduler(): void {
    cron.schedule("* * * * *", () => {
        void processScheduledMessages();
    });

    logInfo("Scheduler iniciado");
}