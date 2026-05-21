import { env } from "../config/env.js";

import {
    countMessagesSentTodayByPhone,
    findLastSentMessageByPhone,
    ScheduledMessage,
} from "../db/repositories/scheduledMessageRepository.js";

/**
 * Comprueba si se respeta el cooldown entre mensajes al mismo contacto
 * @param message 
 * @returns 
 */
export function canSendByCooldown(message: ScheduledMessage): boolean {
    const lastSentMessage = findLastSentMessageByPhone(message.phone);

    if (!lastSentMessage?.sentAt) {
        return true;
    }

    const lastSentAt = new Date(lastSentMessage.sentAt).getTime();
    const now = Date.now();

    const cooldownMs = env.CONTACT_COOLDOWN_MINUTES * 60 * 1000;

    return now - lastSentAt >= cooldownMs;
}

/**
 * Comprueba si el contacto no ha superado el límite diario de mensajes
 * @param message 
 * @returns 
 */
export function canSendByDailyLimit(message: ScheduledMessage): boolean {
    const now = new Date();

    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const sentToday = countMessagesSentTodayByPhone(
        message.phone,
        dayStart.toISOString(),
        dayEnd.toISOString()
    );

    return sentToday < env.MAX_MESSAGES_PER_CONTACT_PER_DAY;
}