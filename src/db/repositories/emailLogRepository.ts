import { randomUUID } from "crypto";

import { database } from "../database.js";

/**
 * Representa un log de email
 */
export type EmailLog = {
    id: string;
    messageId: string | null;

    recipient: string;
    subject: string;

    type: string | null;
    status: string;

    sentAt: string | null;
    success: number | null;

    error: string | null;
    errorMessage: string | null;

    createdAt: string;
};

/**
 * Registra un intento de envío de email
 * @param recipient
 * @param subject
 * @param status
 * @param errorMessage
 */
export function createEmailLog(
    recipient: string,
    subject: string,
    status: string,
    errorMessage?: string
): void {
    database
        .prepare(
            `
            INSERT INTO email_logs (
                id,
                recipient,
                subject,
                status,
                errorMessage,
                createdAt
            ) VALUES (?, ?, ?, ?, ?, ?)
            `
        )
        .run(
            randomUUID(),
            recipient,
            subject,
            status,
            errorMessage ?? null,
            new Date().toISOString()
        );
}

/**
 * Devuelve todos los logs de email
 * @returns
 */
export function findEmailLogs(): EmailLog[] {
    return database
        .prepare(
            `
            SELECT *
            FROM email_logs
            ORDER BY COALESCE(createdAt, sentAt) DESC
            `
        )
        .all() as EmailLog[];
}

/**
 * Busca logs asociados a un mensaje concreto
 * @param messageId
 * @returns
 */
export function findEmailLogsByMessageId(messageId: string): EmailLog[] {
    return database
        .prepare(
            `
            SELECT *
            FROM email_logs
            WHERE messageId = ?
            ORDER BY createdAt DESC
            `
        )
        .all(messageId) as EmailLog[];
}