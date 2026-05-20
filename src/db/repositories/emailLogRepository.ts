import { randomUUID } from "crypto";

import { database } from "../database.js";

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