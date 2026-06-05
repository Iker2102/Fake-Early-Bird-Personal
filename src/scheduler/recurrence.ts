import type { RecurrenceType, ScheduledMessage } from "../db/repositories/scheduledMessageRepository.js";

export function getNextRecurringDate(message: ScheduledMessage): string | null {
    if (!message.recurrence || message.recurrence === "none") {
        return null;
    }

    const interval = message.recurrenceInterval ?? 1;
    const date = new Date(message.scheduledAt);

    if (message.recurrence === "daily") {
        date.setDate(date.getDate() + interval);
    }

    if (message.recurrence === "weekly") {
        date.setDate(date.getDate() + interval * 7);
    }

    if (message.recurrence === "monthly") {
        date.setMonth(date.getMonth() + interval);
    }

    return date.toISOString();
}

export function isValidRecurrence(value: unknown): value is RecurrenceType {
    return (
        value === "none" ||
        value === "daily" ||
        value === "weekly" ||
        value === "monthly"
    );
}