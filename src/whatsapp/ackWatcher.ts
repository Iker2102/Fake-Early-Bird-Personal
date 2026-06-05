import { env } from "../config/env.js";
import {
    findMessageByWhatsappId,
    findScheduledMessages,
    markMessageAsAckFailed,
    markMessageAsDelivered,
    requeueMessageByWhatsappId,
} from "../db/repositories/scheduledMessageRepository.js";
import {
    sendDeliverySuccessEmail,
    sendRetryExhaustedEmail,
} from "../email/mailer.js";
import { logError, logInfo, logWarn } from "../shared/logger.js";

import { ACK_LEVELS, getAckLabel } from "./ackLevels.js";
import { clearDeliveryTimeout } from "./deliveryTimeout.js";

let isAckWatcherRegistered = false;

/**
 * Registra el listener de ACK para actualizar mensajes entregados
 */
export function registerAckWatcher(client: any): void {
    if (isAckWatcherRegistered) {
        return;
    }

    isAckWatcherRegistered = true;

    client.on("message_ack", (message: any, ack: number) => {
        const whatsappMessageId = message.id?._serialized;
        const scheduledMessage = findMessageByWhatsappId(whatsappMessageId);

        if (!whatsappMessageId) {
            return;
        }

        if(!scheduledMessage) {
            return;
        }

        logInfo(`ACK recibido: ${whatsappMessageId} -> ${ack} (${getAckLabel(ack)})`);

        if (ack < ACK_LEVELS.PENDING) {
            const reason = `ack_error_${ack}`;

            clearDeliveryTimeout(whatsappMessageId);
            markMessageAsAckFailed(whatsappMessageId, reason);

            const failedMessage = findMessageByWhatsappId(whatsappMessageId);

            if (failedMessage && failedMessage.retryCount < env.RETRY_MAX) {
                logWarn(`ACK fallido. Reintentando mensaje ${failedMessage.id}`);

                requeueMessageByWhatsappId(whatsappMessageId);
            } else {
                logError(`ACK fallido definitivo para ${whatsappMessageId}`);

                if (failedMessage) {
                    sendRetryExhaustedEmail({
                        contactName: failedMessage.contactName,
                        phone: failedMessage.phone,
                        messageExcerpt: failedMessage.message.slice(0, 120),
                        retryCount: failedMessage.retryCount,
                        reason,
                    });
                }
            }

            return;
        }

        if (ack >= ACK_LEVELS.DEVICE) {
            const deliveredAt = new Date().toISOString();

            const deliveredMessage = markMessageAsDelivered(
                whatsappMessageId,
                ack,
                deliveredAt
            );

            clearDeliveryTimeout(whatsappMessageId);

            if (deliveredMessage) {
                sendDeliverySuccessEmail({
                    contactName: deliveredMessage.contactName,
                    phone: deliveredMessage.phone,
                    messageExcerpt: deliveredMessage.message.slice(0, 120),
                    ackLevel: ack,
                    ackLabel: getAckLabel(ack),
                    deliveredAt,
                });
            }

            return;
        }
    });
}

/**
 * Resetea el registro del ACK watcher
 */
export function resetAckWatcher(): void {
    isAckWatcherRegistered = false;
}