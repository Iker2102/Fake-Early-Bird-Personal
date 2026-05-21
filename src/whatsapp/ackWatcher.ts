import { markMessageAsDelivered } from "../db/repositories/scheduledMessageRepository.js";

/**
 * Registra el listener de ACK para actualizar mensajes entregados
 * @param client 
 */
export function registerAckWatcher(client: any): void {
    client.on("message_ack", (message: any, ack: number) => {
        const whatsappMessageId = message.id?._serialized;

        if (!whatsappMessageId) {
            return;
        }

        console.log(`ACK recibido: ${whatsappMessageId} -> ${ack}`);

        if (ack >= 2) {
            markMessageAsDelivered(whatsappMessageId, ack);
        }
    });
}