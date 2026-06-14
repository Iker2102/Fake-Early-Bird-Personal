import { env } from "../config/env.js";
import { logInfo } from "../shared/logger.js";
import { sleep, randomBetween } from "../shared/time.js";

import {
    getDeviceClient,
    isDeviceReady,
} from "./deviceManager.js";

import { whatsappSendLock } from "./sendLock.js";

/**
 * Envía un mensaje manual de WhatsApp desde un dispositivo concreto
 * @param deviceId 
 * @param phone 
 * @param message 
 * @returns 
 */
export async function sendManualMessage(
    deviceId: string,
    phone: string,
    message: string
): Promise<string> {
    return whatsappSendLock.runExclusive(async () => {
        const client = getDeviceClient(deviceId);

        if (!isDeviceReady(deviceId) || !client) {
            throw new Error("WHATSAPP_NOT_READY");
        }

        const cleanPhone = phone.replace("+", "").replace(/\s/g, "");
        const chatId = `${cleanPhone}@c.us`;

        const delaySeconds = randomBetween(
            env.RANDOM_DELAY_MIN_SECONDS,
            env.RANDOM_DELAY_MAX_SECONDS
        );

        logInfo(
            `Esperando ${delaySeconds}s antes de enviar mensaje desde ${deviceId}`
        );

        await sleep(delaySeconds * 1000);

        const typingDelay =
            env.TYPING_BASE_DELAY_MS + message.length * env.TYPING_MS_PER_CHAR;

        const chat = await client.getChatById(chatId);

        await chat.sendStateTyping();

        await sleep(typingDelay);

        await chat.clearState();

        const sentMessage = await client.sendMessage(chatId, message);

        logInfo(`Mensaje enviado correctamente desde ${deviceId}`);

        return sentMessage.id._serialized;
    });
}