import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentDateInTimezone = vi.fn();
const isWeekend = vi.fn();
const isWithinWorkHours = vi.fn();

const findDueScheduledMessages = vi.fn();
const markMessageAsSending = vi.fn();
const markMessageAsSent = vi.fn();
const markMessageAsFailed = vi.fn();

const sendManualMessage = vi.fn();
const isClientReady = vi.fn();

const canSendByCooldown = vi.fn();
const canSendByDailyLimit = vi.fn();

const startDeliveryTimeout = vi.fn();

vi.mock("../../src/scheduler/workTime.js", () => ({
    getCurrentDateInTimezone,
    isWeekend,
    isWithinWorkHours,
}));

vi.mock("../../src/db/repositories/scheduledMessageRepository.js", () => ({
    findDueScheduledMessages,
    markMessageAsSending,
    markMessageAsSent,
    markMessageAsFailed,
}));

vi.mock("../../src/whatsapp/sender.js", () => ({
    sendManualMessage,
}));

vi.mock("../../src/whatsapp/client.js", () => ({
    isClientReady,
}));

vi.mock("../../src/scheduler/rules.js", () => ({
    canSendByCooldown,
    canSendByDailyLimit,
}));

vi.mock("../../src/whatsapp/deliveryTimeout.js", () => ({
    startDeliveryTimeout,
}));

vi.mock("node-cron", () => ({
    default: {
        schedule: vi.fn(),
    },
}));

vi.mock("../../src/shared/logger.js", () => ({
    logInfo: vi.fn(),
}));

describe("processScheduledMessages", () => {
    beforeEach(() => {
        vi.resetModules();

        getCurrentDateInTimezone.mockReset();
        isWeekend.mockReset();
        isWithinWorkHours.mockReset();

        findDueScheduledMessages.mockReset();
        markMessageAsSending.mockReset();
        markMessageAsSent.mockReset();
        markMessageAsFailed.mockReset();

        sendManualMessage.mockReset();
        isClientReady.mockReset();

        canSendByCooldown.mockReset();
        canSendByDailyLimit.mockReset();

        startDeliveryTimeout.mockReset();

        getCurrentDateInTimezone.mockReturnValue(new Date("2026-05-29T10:00:00.000Z"));
        isClientReady.mockReturnValue(true);
        isWeekend.mockReturnValue(false);
        isWithinWorkHours.mockReturnValue(true);
        canSendByCooldown.mockReturnValue(true);
        canSendByDailyLimit.mockReturnValue(true);
    });

    it("no procesa mensajes si WhatsApp no está listo", async () => {
        isClientReady.mockReturnValue(false);

        const { processScheduledMessages } = await import(
            "../../src/scheduler/cron.js"
        );

        await processScheduledMessages();

        expect(findDueScheduledMessages).not.toHaveBeenCalled();
        expect(sendManualMessage).not.toHaveBeenCalled();
    });

    it("no procesa mensajes en fin de semana", async () => {
        isWeekend.mockReturnValue(true);

        const { processScheduledMessages } = await import(
            "../../src/scheduler/cron.js"
        );

        await processScheduledMessages();

        expect(findDueScheduledMessages).not.toHaveBeenCalled();
        expect(sendManualMessage).not.toHaveBeenCalled();
    });

    it("no procesa mensajes fuera del horario laboral", async () => {
        isWithinWorkHours.mockReturnValue(false);

        const { processScheduledMessages } = await import(
            "../../src/scheduler/cron.js"
        );

        await processScheduledMessages();

        expect(findDueScheduledMessages).not.toHaveBeenCalled();
        expect(sendManualMessage).not.toHaveBeenCalled();
    });

    it("envía mensajes pendientes y actualiza estados", async () => {
        findDueScheduledMessages.mockReturnValue([
            {
                id: "msg-1",
                phone: "+34600111222",
                message: "Hola",
            },
        ]);

        sendManualMessage.mockResolvedValue("wa-message-id");

        const { processScheduledMessages } = await import(
            "../../src/scheduler/cron.js"
        );

        await processScheduledMessages();

        expect(markMessageAsSending).toHaveBeenCalledWith("msg-1");

        expect(sendManualMessage).toHaveBeenCalledWith(
            "+34600111222",
            "Hola"
        );

        expect(markMessageAsSent).toHaveBeenCalledWith(
            "msg-1",
            "wa-message-id"
        );

        expect(startDeliveryTimeout).toHaveBeenCalledWith("wa-message-id");
    });

    it("marca mensaje como failed si el envío falla", async () => {
        findDueScheduledMessages.mockReturnValue([
            {
                id: "msg-1",
                phone: "+34600111222",
                message: "Hola",
            },
        ]);

        sendManualMessage.mockRejectedValue(new Error("SMTP no, WhatsApp error"));

        const { processScheduledMessages } = await import(
            "../../src/scheduler/cron.js"
        );

        await processScheduledMessages();

        expect(markMessageAsSending).toHaveBeenCalledWith("msg-1");
        expect(markMessageAsFailed).toHaveBeenCalledWith(
            "msg-1",
            "SMTP no, WhatsApp error"
        );
    });

    it("no marca como failed si WhatsApp no está listo durante el envío", async () => {
        findDueScheduledMessages.mockReturnValue([
            {
                id: "msg-1",
                phone: "+34600111222",
                message: "Hola",
            },
        ]);

        sendManualMessage.mockRejectedValue(new Error("WHATSAPP_NOT_READY"));

        const { processScheduledMessages } = await import(
            "../../src/scheduler/cron.js"
        );

        await processScheduledMessages();

        expect(markMessageAsSending).toHaveBeenCalledWith("msg-1");
        expect(markMessageAsFailed).not.toHaveBeenCalled();
    });

    it("omite mensajes bloqueados por cooldown", async () => {
        canSendByCooldown.mockReturnValue(false);

        findDueScheduledMessages.mockReturnValue([
            {
                id: "msg-1",
                phone: "+34600111222",
                message: "Hola",
            },
        ]);

        const { processScheduledMessages } = await import(
            "../../src/scheduler/cron.js"
        );

        await processScheduledMessages();

        expect(sendManualMessage).not.toHaveBeenCalled();
        expect(markMessageAsSending).not.toHaveBeenCalled();
    });

    it("omite mensajes bloqueados por límite diario", async () => {
        canSendByDailyLimit.mockReturnValue(false);

        findDueScheduledMessages.mockReturnValue([
            {
                id: "msg-1",
                phone: "+34600111222",
                message: "Hola",
            },
        ]);

        const { processScheduledMessages } = await import(
            "../../src/scheduler/cron.js"
        );

        await processScheduledMessages();

        expect(sendManualMessage).not.toHaveBeenCalled();
        expect(markMessageAsSending).not.toHaveBeenCalled();
    });
});