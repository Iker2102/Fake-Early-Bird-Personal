import { env } from "../config/env.js";
import { findMessageByWhatsappId, markMessageAsAckFailed, markMessageAsDelivered, requeueMessageByWhatsappId } from "../db/repositories/scheduledMessageRepository.js";

import { ACK_LEVELS, getAckLabel } from "./ackLevels.js";
import { clearDeliveryTimeout } from "./deliveryTimeout.js";

/**
 * Registra el listener de ACK para actualizar mensajes entregados.
 */
export function registerAckWatcher(client: any): void {
    client.on("message_ack", (message: any, ack: number) => {
        const whatsappMessageId = message.id?._serialized;

        if (!whatsappMessageId) {
            return;
        }

        console.log(`ACK recibido: ${whatsappMessageId} -> ${ack} (${getAckLabel(ack)})`);

        if (ack < ACK_LEVELS.PENDING) {
            const reason = `ack_error_${ack}`;

            clearDeliveryTimeout(whatsappMessageId);
            markMessageAsAckFailed(whatsappMessageId, reason);

            const failedMessage = findMessageByWhatsappId(whatsappMessageId);

            if (failedMessage && failedMessage.retryCount < env.RETRY_MAX) {
                console.warn(`ACK fallido. Reintentando mensaje ${failedMessage.id}`);
                requeueMessageByWhatsappId(whatsappMessageId);
            } else {
                console.error(`ACK fallido definitivo para ${whatsappMessageId}`);
            }

            return;
        }

        if (ack >= ACK_LEVELS.DEVICE) {
            markMessageAsDelivered(whatsappMessageId, ack);
            clearDeliveryTimeout(whatsappMessageId);
            return;
        }
    });
}