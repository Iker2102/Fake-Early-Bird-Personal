import { env } from "../config/env.js";
import { logInfo } from "../shared/logger.js";
import { sleep, randomBetween } from "../shared/time.js";
import { isClientReady, whatsappClient } from "./client.js";

/**
 * Envía un mensaje manual de WhatsApp a un número concreto
 * 
 * No se hizo con sendPresenceUpdate('composing'), se hizo con typing y pausa proporcional al texto, que es equivalente
 * 
 * @param phone 
 * @param message 
 */
export async function sendManualMessage(phone: string, message: string): Promise<string> {
    if (!isClientReady() || !whatsappClient) {
        throw new Error("WHATSAPP_NOT_READY");
    }

    const cleanPhone = phone.replace("+", "").replace(/\s/g, "");
    const chatId = `${cleanPhone}@c.us`;

    const delaySeconds = randomBetween(
        env.RANDOM_DELAY_MIN_SECONDS,
        env.RANDOM_DELAY_MAX_SECONDS
    );

    logInfo(`Esperando ${delaySeconds}s antes de enviar a ${phone}`);

    await sleep(delaySeconds * 1000);

    const typingDelay =
        env.TYPING_BASE_DELAY_MS + message.length * env.TYPING_MS_PER_CHAR;

    const chat = await whatsappClient.getChatById(chatId);

    await chat.sendStateTyping();

    await sleep(typingDelay);

    await chat.clearState();

    const sentMessage = await whatsappClient.sendMessage(chatId, message);

    logInfo(`Mensaje enviado a ${phone}`);

    return sentMessage.id._serialized;
}