import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailQueue } from "../../src/email/emailQueue.js";

describe("EmailQueue", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it("envía un email correctamente y registra log sent", async () => {
        const sendMail = vi.fn().mockResolvedValue(undefined);
        const createEmailLog = vi.fn();

        const queue = new EmailQueue({
            maxAttempts: 3,
            retryDelaysMs: [1000, 2000, 3000],
            pollIntervalMs: 100,
            sendMail,
            createEmailLog,
        });

        queue.enqueue("test@test.com", "Asunto", "<p>Hola</p>");

        await vi.advanceTimersByTimeAsync(100);

        expect(sendMail).toHaveBeenCalledTimes(1);
        expect(createEmailLog).toHaveBeenCalledWith(
            "test@test.com",
            "Asunto",
            "sent"
        );

        queue.stop();
    });

    it("reintenta si falla el envío", async () => {
        const sendMail = vi
            .fn()
            .mockRejectedValueOnce(new Error("SMTP error"))
            .mockResolvedValueOnce(undefined);

        const createEmailLog = vi.fn();

        const queue = new EmailQueue({
            maxAttempts: 3,
            retryDelaysMs: [1000, 2000, 3000],
            pollIntervalMs: 100,
            sendMail,
            createEmailLog,
        });

        queue.enqueue("test@test.com", "Asunto", "<p>Hola</p>");

        await vi.advanceTimersByTimeAsync(100);
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(100);

        expect(sendMail).toHaveBeenCalledTimes(2);
        expect(createEmailLog).toHaveBeenCalledWith(
            "test@test.com",
            "Asunto",
            "sent"
        );

        queue.stop();
    });

    it("marca como failed tras agotar reintentos", async () => {
        const sendMail = vi.fn().mockRejectedValue(new Error("SMTP error"));
        const createEmailLog = vi.fn();

        const queue = new EmailQueue({
            maxAttempts: 3,
            retryDelaysMs: [1000, 2000, 3000],
            pollIntervalMs: 100,
            sendMail,
            createEmailLog,
        });

        queue.enqueue("test@test.com", "Asunto", "<p>Hola</p>");

        await vi.advanceTimersByTimeAsync(100);
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(100);
        await vi.advanceTimersByTimeAsync(2000);
        await vi.advanceTimersByTimeAsync(100);

        expect(sendMail).toHaveBeenCalledTimes(3);
        expect(createEmailLog).toHaveBeenCalledWith(
            "test@test.com",
            "Asunto",
            "failed",
            "SMTP error"
        );

        queue.stop();
    });
});