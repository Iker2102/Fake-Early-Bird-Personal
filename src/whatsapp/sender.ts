import { isClientReady, whatsappClient } from "./client.js";

/**
 * Envía un mensaje manual de WhatsApp a un número concreto.
 */
export async function sendManualMessage(phone: string, message: string): Promise<void> {
    if (!isClientReady() || !whatsappClient) {
        throw new Error("WHATSAPP_NOT_READY");
    }

    const cleanPhone = phone.replace("+", "").replace(/\s/g, "");
    const chatId = `${cleanPhone}@c.us`;

    await whatsappClient.sendMessage(chatId, message);

    console.log(`Mensaje enviado a ${phone}`);
}