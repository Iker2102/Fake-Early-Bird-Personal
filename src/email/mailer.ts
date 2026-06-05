import nodemailer from "nodemailer";

import { env } from "../config/env.js";
import { createEmailLog } from "../db/repositories/emailLogRepository.js";

import { renderEmailTemplate } from "./templateRenderer.js";
import { EmailQueue } from "./emailQueue.js";

import { pushLog } from "../api/logStream.js";
import { logInfo, logWarn } from "../shared/logger.js";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});


const MAX_ATTEMPTS = 3;

const RETRY_DELAYS_MS = [
    60_000,
    5 * 60_000,
    15 * 60_000,
];

const POLL_INTERVAL_MS = 1_000;

/**
 * Comprueba la conexión SMTP al arrancar la aplicación.
 */
export async function verifyEmailTransport(): Promise<void> {
    try {
        await transporter.verify();

        logInfo("SMTP conectado correctamente");
    } catch {
        logWarn("SMTP no disponible en entorno de desarrollo");
    }
}

/**
 * Cola simple en memoria para enviar emails sin bloquear el flujo principal.
 */

export const emailQueue = new EmailQueue({
    maxAttempts: MAX_ATTEMPTS,
    retryDelaysMs: RETRY_DELAYS_MS,
    pollIntervalMs: POLL_INTERVAL_MS,

    sendMail: async (job) => {
        await transporter.sendMail({
            from: env.SMTP_FROM,
            to: job.to,
            subject: job.subject,
            html: job.html,
        });

        pushLog("info", `Email enviado: ${job.subject}`);
    },

    createEmailLog,
});

/**
 * Encola una alerta cuando WhatsApp se desconecta y hay mensajes pendientes
 * @param reason 
 * @param pendingMessagesCount 
 * @returns 
 */
export function sendDisconnectAlertEmail(
    reason: string,
    pendingMessagesCount: number
): void {
    if (!env.NOTIFY_ON_DISCONNECT) {
        return;
    }

    const subject = "Fake Early Bird - WhatsApp desconectado";

    const html = renderEmailTemplate("whatsapp_disconnected.html", {
        reason,
        pendingMessagesCount,
    });

    emailQueue.enqueue(env.NOTIFY_EMAIL, subject, html);
}

/**
 * Envía un email de confirmación cuando un mensaje ha sido entregado correctamente
 * @param params 
 * @returns 
 */
export function sendDeliverySuccessEmail(params: {
    contactName: string | null;
    phone: string;
    messageExcerpt: string;
    ackLevel: number;
    ackLabel: string;
    deliveredAt: string;
}): void {
    if (!env.NOTIFY_ON_SUCCESS) {
        return;
    }

    const subject = "Fake Early Bird - Mensaje entregado";

    const html = renderEmailTemplate("delivery_success.html", {
        contactName: params.contactName ?? "Sin nombre",
        phone: params.phone,
        messageExcerpt: params.messageExcerpt,
        ackLevel: params.ackLevel,
        ackLabel: params.ackLabel,
        deliveredAt: params.deliveredAt,
    });

    emailQueue.enqueue(env.NOTIFY_EMAIL, subject, html);
}

/**
 * Envía un email de alerta cuando un mensaje no ha podido entregarse
 * @param params 
 */
export function sendDeliveryFailureEmail(params: {
    contactName: string | null;
    phone: string;
    messageExcerpt: string;
    reason: string;
}): void {
    const subject = "Fake Early Bird - Mensaje fallido";

    const html = renderEmailTemplate("delivery_failure.html", {
        contactName: params.contactName ?? "Sin nombre",
        phone: params.phone,
        messageExcerpt: params.messageExcerpt,
        reason: params.reason,
    });

    emailQueue.enqueue(env.NOTIFY_EMAIL, subject, html);
}

/**
 * Envía un email crítico cuando un mensaje ha agotado todos los reintentos
 * @param params 
 */
export function sendRetryExhaustedEmail(params: {
    contactName: string | null;
    phone: string;
    messageExcerpt: string;
    retryCount: number;
    reason: string;
}): void {
    const subject = "Fake Early Bird - Reintentos agotados";

    const html = renderEmailTemplate("retry_exhausted.html", {
        contactName: params.contactName ?? "Sin nombre",
        phone: params.phone,
        messageExcerpt: params.messageExcerpt,
        retryCount: params.retryCount,
        reason: params.reason,
    });

    emailQueue.enqueue(env.NOTIFY_EMAIL, subject, html);
}

/**
 * Envía un resumen diario
 * @param params 
 */
export function sendDailySummaryEmail(params: {
    sentToday: number;
    deliveredToday: number;
    failedToday: number;
    deliveryRate: number;
    emailsSentToday: number;
    date: string;
}): void {
    const subject = `Fake Early Bird - Resumen diario ${params.date}`;

    const html = renderEmailTemplate("daily_summary.html", {
        sentToday: params.sentToday,
        deliveredToday: params.deliveredToday,
        failedToday: params.failedToday,
        deliveryRate: params.deliveryRate,
        emailsSentToday: params.emailsSentToday,
        date: params.date,
    });

    emailQueue.enqueue(env.NOTIFY_EMAIL, subject, html, "daily_summary");
}