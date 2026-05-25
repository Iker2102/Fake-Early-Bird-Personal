import { env } from "../config/env.js";
import {
    findMessageByWhatsappId,
    markMessageAsDeliveryFailed,
} from "../db/repositories/scheduledMessageRepository.js";
import { sendDeliveryFailureEmail } from "../email/mailer.js";

const activeDeliveryTimers = new Map<string, NodeJS.Timeout>();

/**
 * Inicia un temporizador para comprobar si un mensaje llega a entregarse
 */
export function startDeliveryTimeout(whatsappMessageId: string): void {
    if (activeDeliveryTimers.has(whatsappMessageId)) {
        return;
    }

    const timeoutMs = env.DELIVERY_TIMEOUT_MINUTES * 60 * 1000;

    const timer = setTimeout(() => {
        const message = findMessageByWhatsappId(whatsappMessageId);

        markMessageAsDeliveryFailed(whatsappMessageId);

        activeDeliveryTimers.delete(whatsappMessageId);

        console.warn(`Timeout de entrega para mensaje ${whatsappMessageId}`);

        if (message) {
            sendDeliveryFailureEmail({
                contactName: message.contactName,
                phone: message.phone,
                messageExcerpt: message.message.slice(0, 120),
                reason: "timeout",
            });
        }
    }, timeoutMs);

    activeDeliveryTimers.set(whatsappMessageId, timer);
}

/**
 * Cancela el temporizador cuando el mensaje ha sido entregado
 */
export function clearDeliveryTimeout(whatsappMessageId: string): void {
    const timer = activeDeliveryTimers.get(whatsappMessageId);

    if (!timer) {
        return;
    }

    clearTimeout(timer);

    activeDeliveryTimers.delete(whatsappMessageId);
}