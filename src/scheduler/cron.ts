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

/**
 * Procesa la cola de mensajes pendientes
 * @returns 
 */
async function processScheduledMessages(): Promise<void> {

    const currentDate = getCurrentDateInTimezone();


    if (!isClientReady()) {
        console.log("Scheduler pausado: WhatsApp no está listo");
        return;
    }

    if (isProcessingQueue) {
        console.log("La cola ya se está procesando");
        return;
    }

    if (isWeekend(currentDate)) {
        console.log("Scheduler pausado: fin de semana");
        return;
    }

    if (!isWithinWorkHours(currentDate)) {
        console.log("Scheduler pausado: fuera del horario laboral");
        return;
    }

    isProcessingQueue = true;

    try {
        const now = new Date().toISOString();
        const messages = findDueScheduledMessages(now);

        for (const message of messages) {

            if (!canSendByCooldown(message)) {
                console.log(`Mensaje ${message.id} pausado por cooldown`);
                continue;
            }

            if (!canSendByDailyLimit(message)) {
                console.log(`Mensaje ${message.id} pausado por límite diario`);
                continue;
            }

            try {
                markMessageAsSending(message.id);

                await sendManualMessage(message.phone, message.message);

                markMessageAsSent(message.id);
            } catch (error) {
                const reason = error instanceof Error ? error.message : "Error desconocido";

                if (reason === "WHATSAPP_NOT_READY") {
                    console.log("WhatsApp no está listo, el mensaje seguirá en cola");
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

    console.log("Scheduler iniciado");
}