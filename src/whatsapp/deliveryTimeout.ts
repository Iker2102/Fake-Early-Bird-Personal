import { env } from "../config/env.js";
import { markMessageAsDeliveryFailed } from "../db/repositories/scheduledMessageRepository.js";

const activeDeliveryTimers = new Map<string, NodeJS.Timeout>();

/**
 * Inicia un temporizador para comprobar si un mensaje llega a entregarse
 * @param whatsappMessageId 
 * @returns 
 */
export function startDeliveryTimeout(whatsappMessageId: string): void {
    if (activeDeliveryTimers.has(whatsappMessageId)) {
        return;
    }

    const timeoutMs = env.DELIVERY_TIMEOUT_MINUTES * 60 * 1000;

    const timer = setTimeout(() => {
        markMessageAsDeliveryFailed(whatsappMessageId);

        activeDeliveryTimers.delete(whatsappMessageId);

        console.warn(`Timeout de entrega para mensaje ${whatsappMessageId}`);
    }, timeoutMs);

    activeDeliveryTimers.set(whatsappMessageId, timer);
}

/**
 * Cancela el temporizador cuando el mensaje ha sido entregado
 * @param whatsappMessageId 
 * @returns 
 */
export function clearDeliveryTimeout(whatsappMessageId: string): void {
    const timer = activeDeliveryTimers.get(whatsappMessageId);

    if (!timer) {
        return;
    }

    clearTimeout(timer);

    activeDeliveryTimers.delete(whatsappMessageId);
}