import { beforeEach, describe, expect, it, vi } from "vitest";

const markMessageAsDelivered = vi.fn();
const clearDeliveryTimeout = vi.fn();
const markMessageAsAckFailed = vi.fn();
const findMessageByWhatsappId = vi.fn();
const requeueMessageByWhatsappId = vi.fn();
const sendDeliverySuccessEmail = vi.fn();
const sendRetryExhaustedEmail = vi.fn();

vi.mock("../../src/config/env.js", () => ({
    env: {
        RETRY_MAX: 3,
    },
}));

vi.mock("../../src/db/repositories/scheduledMessageRepository.js", () => ({
    markMessageAsDelivered,
    markMessageAsAckFailed,
    findMessageByWhatsappId,
    requeueMessageByWhatsappId,
}));

vi.mock("../../src/whatsapp/deliveryTimeout.js", () => ({
    clearDeliveryTimeout,
}));

vi.mock("../../src/email/mailer.js", () => ({
    sendDeliverySuccessEmail,
    sendRetryExhaustedEmail,
}));

describe("ackWatcher", () => {
    beforeEach(() => {
        vi.resetModules();

        markMessageAsDelivered.mockReset();
        clearDeliveryTimeout.mockReset();
        markMessageAsAckFailed.mockReset();
        findMessageByWhatsappId.mockReset();
        requeueMessageByWhatsappId.mockReset();
        sendDeliverySuccessEmail.mockReset();
        sendRetryExhaustedEmail.mockReset();
    });

    function createMockClient() {
        const handlers = new Map<string, (...args: any[]) => void>();

        return {
            on: vi.fn((event: string, callback: (...args: any[]) => void) => {
                handlers.set(event, callback);
            }),
            emitAck(messageId: string, ack: number) {
                const handler = handlers.get("message_ack");

                if (!handler) {
                    throw new Error("message_ack handler not registered");
                }

                handler(
                    {
                        id: {
                            _serialized: messageId,
                        },
                    },
                    ack
                );
            },
        };
    }

    it("marca mensaje como entregado cuando ACK es DEVICE o superior", async () => {
        const { registerAckWatcher, resetAckWatcher } = await import(
            "../../src/whatsapp/ackWatcher.js"
        );

        resetAckWatcher();

        const client = createMockClient();

        const deliveredMessage = {
            id: "msg-1",
            phone: "+34600111222",
            contactName: "Iker",
            message: "Mensaje de prueba",
            retryCount: 0,
        };

        markMessageAsDelivered.mockReturnValue(deliveredMessage);

        registerAckWatcher(client);

        client.emitAck("wa-message-id", 2);

        expect(markMessageAsDelivered).toHaveBeenCalledWith(
            "wa-message-id",
            2,
            expect.any(String)
        );

        expect(clearDeliveryTimeout).toHaveBeenCalledWith("wa-message-id");

        expect(sendDeliverySuccessEmail).toHaveBeenCalledWith({
            contactName: "Iker",
            phone: "+34600111222",
            messageExcerpt: "Mensaje de prueba",
            ackLevel: 2,
            ackLabel: "device",
            deliveredAt: expect.any(String),
        });
    });

    it("reencola mensaje si ACK es error y retryCount es menor que RETRY_MAX", async () => {
        const { registerAckWatcher, resetAckWatcher } = await import(
            "../../src/whatsapp/ackWatcher.js"
        );

        resetAckWatcher();

        const client = createMockClient();

        findMessageByWhatsappId.mockReturnValue({
            id: "msg-1",
            phone: "+34600111222",
            contactName: "Iker",
            message: "Mensaje de prueba",
            retryCount: 1,
        });

        registerAckWatcher(client);

        client.emitAck("wa-message-id", -1);

        expect(clearDeliveryTimeout).toHaveBeenCalledWith("wa-message-id");
        expect(markMessageAsAckFailed).toHaveBeenCalledWith(
            "wa-message-id",
            "ack_error_-1"
        );
        expect(requeueMessageByWhatsappId).toHaveBeenCalledWith("wa-message-id");
        expect(sendRetryExhaustedEmail).not.toHaveBeenCalled();
    });

    it("envía email crítico si ACK falla y se agotaron los reintentos", async () => {
        const { registerAckWatcher, resetAckWatcher } = await import(
            "../../src/whatsapp/ackWatcher.js"
        );

        resetAckWatcher();

        const client = createMockClient();

        findMessageByWhatsappId.mockReturnValue({
            id: "msg-1",
            phone: "+34600111222",
            contactName: "Iker",
            message: "Mensaje de prueba",
            retryCount: 3,
        });

        registerAckWatcher(client);

        client.emitAck("wa-message-id", -1);

        expect(markMessageAsAckFailed).toHaveBeenCalledWith(
            "wa-message-id",
            "ack_error_-1"
        );

        expect(requeueMessageByWhatsappId).not.toHaveBeenCalled();

        expect(sendRetryExhaustedEmail).toHaveBeenCalledWith({
            contactName: "Iker",
            phone: "+34600111222",
            messageExcerpt: "Mensaje de prueba",
            retryCount: 3,
            reason: "ack_error_-1",
        });
    });

    it("ignora ACK si no existe whatsappMessageId", async () => {
        const { registerAckWatcher, resetAckWatcher } = await import(
            "../../src/whatsapp/ackWatcher.js"
        );

        resetAckWatcher();

        const handlers = new Map<string, (...args: any[]) => void>();

        const client = {
            on: vi.fn((event: string, callback: (...args: any[]) => void) => {
                handlers.set(event, callback);
            }),
        };

        registerAckWatcher(client);

        const handler = handlers.get("message_ack");

        if (!handler) {
            throw new Error("message_ack handler not registered");
        }

        handler({}, 2);

        expect(markMessageAsDelivered).not.toHaveBeenCalled();
        expect(markMessageAsAckFailed).not.toHaveBeenCalled();
        expect(clearDeliveryTimeout).not.toHaveBeenCalled();
    });
});