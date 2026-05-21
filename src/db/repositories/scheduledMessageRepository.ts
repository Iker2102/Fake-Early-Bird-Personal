import { randomUUID } from "crypto";

import { database } from "../database.js";

import { env } from "../../config/env.js";
import { randomBetween } from "../../shared/time.js";

/**
 * Estados disponibles en un mensaje programado
 */
export type ScheduledMessageStatus = "scheduled" | "sending" | "sent" | "failed";

/**
 * Representa el mensaje programado alamcenado en la base de datos
 */
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

/**
 * Datos necesarios para crear un mensaje
 */
export type CreateScheduledMessageInput = {
    phone: string;
    contactName?: string | null;
    message: string;
    scheduledAt: string;
};

/**
 * Crea un mensaje programado y lo guarda en el estado inicial
 * @param input
 * @returns 
 */
export function createScheduledMessage(input: CreateScheduledMessageInput): ScheduledMessage {
    const now = new Date().toISOString();

    const message: ScheduledMessage = {
        id: randomUUID(),
        phone: input.phone,
        contactName: input.contactName ?? null,
        message: input.message,
        scheduledAt: applyScheduleVariation(input.scheduledAt),
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

/**
 * Devuelve todos los mensajes programados ordenados por fecha de envío
 * @returns 
 */
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

/**
 * Devuelve los mensajes pendientes cuya fecha programada ya pasó
 * @param now 
 * @returns 
 */
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

/**
 * Marca un mensaje como en proceso de envío
 * @param id 
 */
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

/**
 * Marca un mensaje como enviado correctamente
 * @param id 
 */
export function markMessageAsSent(id: string, whatsappMessageId: string): void {
    database
        .prepare(
            `
            UPDATE scheduled_messages
            SET status = 'sent',
                sentAt = ?,
                whatsappMessageId = ?
            WHERE id = ?
            `
        )
        .run(new Date().toISOString(), whatsappMessageId, id);
}

/**
 * Marca un mensaje como enviado
 * @param whatsappMessageId 
 * @param ackLevel 
 */
export function markMessageAsDelivered(whatsappMessageId: string, ackLevel: number): void {
    database
        .prepare(
            `
            UPDATE scheduled_messages
            SET status = 'delivered',
                deliveredAt = ?,
                ackLevel = ?
            WHERE whatsappMessageId = ?
            `
        )
        .run(new Date().toISOString(), ackLevel, whatsappMessageId);
}

/**
 * Marca un mensaje como fallido y registra el motivo del error
 * @param id 
 * @param reason 
 */
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

/**
 * Cuenta los mensajes pendientes en cola
 * @returns 
 */
export function countPendingMessages(): number {
    const result = database
        .prepare(
            `
            SELECT COUNT(*) as total
            FROM scheduled_messages
            WHERE status = 'scheduled'
            `
        )
        .get() as { total: number };

    return result.total;
}

/**
 * Devuelve el último mensaje enviado a un contacto concreto
 * @param phone 
 * @returns 
 */
export function findLastSentMessageByPhone(phone: string): ScheduledMessage | null {
    const result = database
        .prepare(
            `
            SELECT *
            FROM scheduled_messages
            WHERE phone = ?
              AND status = 'sent'
              AND sentAt IS NOT NULL
            ORDER BY sentAt DESC
            LIMIT 1
            `
        )
        .get(phone) as ScheduledMessage | undefined;

    return result ?? null;
}

/**
 * Cuenta cuántos mensajes se han enviado hoy a un contacto concreto
 * @param phone 
 * @param dayStart 
 * @param dayEnd 
 * @returns 
 */
export function countMessagesSentTodayByPhone(phone: string, dayStart: string, dayEnd: string): number {
    const result = database
        .prepare(
            `
            SELECT COUNT(*) as total
            FROM scheduled_messages
            WHERE phone = ?
              AND status = 'sent'
              AND sentAt >= ?
              AND sentAt < ?
            `
        )
        .get(phone, dayStart, dayEnd) as { total: number };

    return result.total;
}

/**
 * Aplica una variación aleatoria de ±N minutos a la fecha programada
 * @param scheduledAt 
 * @returns 
 */
function applyScheduleVariation(scheduledAt: string): string {
    const variationMinutes = env.SCHEDULE_VARIATION_MINUTES;

    if (variationMinutes <= 0) {
        return scheduledAt;
    }

    const offsetMinutes = randomBetween(-variationMinutes, variationMinutes);

    const date = new Date(scheduledAt);
    date.setMinutes(date.getMinutes() + offsetMinutes);

    return date.toISOString();
}