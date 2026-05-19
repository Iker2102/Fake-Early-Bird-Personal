import { whatsappClient } from "./client.js";

/**
 * Envía un mensaje manual de WhatsApp a un número concreto. REHACER mejor más tarde
 */
export async function sendManualMessage(phone: string, message: string): Promise<void> {
    if (!whatsappClient) {
        throw new Error("El cliente de WhatsApp no está inicializado");
    }

    const cleanPhone = phone.replace("+", "").replace(/\s/g, "");
    const chatId = `${cleanPhone}@c.us`;

    await whatsappClient.sendMessage(chatId, message);

    console.log(`Mensaje enviado a ${phone}`);
}