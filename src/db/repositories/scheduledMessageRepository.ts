import { randomUUID } from "crypto";

import { database } from "../database.js";

export type ScheduledMessageStatus = "scheduled" | "sending" | "sent" | "failed";

export type ScheduledMessage = {
    id: string;
    phone: string;
    contactName: string | null;
    message: string;
    scheduledAt: string;
    status: ScheduledMessageStatus;
    createdAt: string;
    sentAt: string | null;
    deliveredAt: string | null;
    ackLevel: number | null;
    retryCount: number;
    notifiedAt: string | null;
    failReason: string | null;
};

export type CreateScheduledMessageInput = {
    phone: string;
    contactName?: string | null;
    message: string;
    scheduledAt: string;
};

export function createScheduledMessage(input: CreateScheduledMessageInput): ScheduledMessage {
    const now = new Date().toISOString();

    const message: ScheduledMessage = {
        id: randomUUID(),
        phone: input.phone,
        contactName: input.contactName ?? null,
        message: input.message,
        scheduledAt: input.scheduledAt,
        status: "scheduled",
        createdAt: now,
        sentAt: null,
        deliveredAt: null,
        ackLevel: null,
        retryCount: 0,
        notifiedAt: null,
        failReason: null,
    };

    database
        .prepare(
            `
            INSERT INTO scheduled_messages (
                id,
                phone,
                contactName,
                message,
                scheduledAt,
                status,
                createdAt,
                sentAt,
                deliveredAt,
                ackLevel,
                retryCount,
                notifiedAt,
                failReason
            ) VALUES (
                @id,
                @phone,
                @contactName,
                @message,
                @scheduledAt,
                @status,
                @createdAt,
                @sentAt,
                @deliveredAt,
                @ackLevel,
                @retryCount,
                @notifiedAt,
                @failReason
            )
            `
        )
        .run(message);

    return message;
}

export function findScheduledMessages(): ScheduledMessage[] {
    return database
        .prepare(
            `
            SELECT *
            FROM scheduled_messages
            ORDER BY scheduledAt ASC
            `
        )
        .all() as ScheduledMessage[];
}

export function findDueScheduledMessages(now: string): ScheduledMessage[] {
    return database
        .prepare(
            `
            SELECT *
            FROM scheduled_messages
            WHERE status = 'scheduled'
              AND scheduledAt <= ?
            ORDER BY scheduledAt ASC
            `
        )
        .all(now) as ScheduledMessage[];
}

export function markMessageAsSending(id: string): void {
    database
        .prepare(
            `
            UPDATE scheduled_messages
            SET status = 'sending'
            WHERE id = ?
            `
        )
        .run(id);
}

export function markMessageAsSent(id: string): void {
    database
        .prepare(
            `
            UPDATE scheduled_messages
            SET status = 'sent',
                sentAt = ?
            WHERE id = ?
            `
        )
        .run(new Date().toISOString(), id);
}

export function markMessageAsFailed(id: string, reason: string): void {
    database
        .prepare(
            `
            UPDATE scheduled_messages
            SET status = 'failed',
                failReason = ?,
                retryCount = retryCount + 1
            WHERE id = ?
            `
        )
        .run(reason, id);
}