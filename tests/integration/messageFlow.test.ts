import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";

const sendManualMessage = vi.fn();
const isClientReady = vi.fn();

vi.mock("../../src/whatsapp/sender.js", () => ({
    sendManualMessage,
}));

vi.mock("../../src/whatsapp/client.js", () => ({
    isClientReady,
}));

vi.mock("../../src/whatsapp/deliveryTimeout.js", () => ({
    startDeliveryTimeout: vi.fn(),
}));

describe("flujo completo de mensajes programados", () => {
    beforeEach(async () => {
        vi.resetModules();

        sendManualMessage.mockReset();
        isClientReady.mockReset();

        isClientReady.mockReturnValue(true);
        sendManualMessage.mockResolvedValue("mock-whatsapp-message-id");

        if (fs.existsSync("./data/test.db")) {
            fs.unlinkSync("./data/test.db");
        }

        const { initializeDatabase } = await import("../../src/db/schema.js");
        initializeDatabase();
    });

    it("procesa un mensaje pendiente y lo marca como enviado", async () => {
        const repository = await import(
            "../../src/db/repositories/scheduledMessageRepository.js"
        );

        const scheduler = await import("../../src/scheduler/cron.js");

        const message = repository.createScheduledMessage({
            phone: "+34600111222",
            contactName: "Iker",
            message: "Mensaje de integración",
            scheduledAt: new Date(Date.now() - 60_000).toISOString(),
        });

        await scheduler.processScheduledMessages();

        const messages = repository.findScheduledMessages();

        const processedMessage = messages.find((item) => item.id === message.id);

        expect(processedMessage).toBeDefined();
        expect(processedMessage?.status).toBe("sent");
        expect(processedMessage?.whatsappMessageId).toBe("mock-whatsapp-message-id");

        expect(sendManualMessage).toHaveBeenCalledWith(
            "+34600111222",
            "Mensaje de integración"
        );
    });
});