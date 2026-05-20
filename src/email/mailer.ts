import nodemailer from "nodemailer";

import { env } from "../config/env.js";

import { createEmailLog } from "../db/repositories/emailLogRepository.js";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

/**
 * Comprueba la conexión SMTP al arrancar la aplicación
 */
export async function verifyEmailTransport(): Promise<void> {
    try {
        await transporter.verify();

        console.log("SMTP conectado correctamente");
    } catch (error) {
        console.warn("SMTP no disponible en entorno de desarrollo");
    }
}

/**
 * Envía una alerta cuando WhatsApp se desconecta y hay mensajes pendientes
 * @param reason 
 * @param pendingMessagesCount 
 * @returns 
 */
export async function sendDisconnectAlertEmail(
    reason: string,
    pendingMessagesCount: number
): Promise<void> {
    if (!env.NOTIFY_ON_DISCONNECT) {
        return;
    }

    const subject = "Fake Early Bird - WhatsApp desconectado";

    try {
        await transporter.sendMail({
            from: env.SMTP_FROM,
            to: env.NOTIFY_EMAIL,
            subject,
            html: `
                <h1>WhatsApp desconectado</h1>

                <p><strong>Motivo:</strong> ${reason}</p>

                <p>
                    Hay <strong>${pendingMessagesCount}</strong>
                    mensajes pendientes en cola.
                </p>

                <p>
                    Revisa el dashboard para volver a conectar la sesión.
                </p>
            `,
        });

        createEmailLog(env.NOTIFY_EMAIL, subject, "sent");

        console.log("Email de alerta enviado");
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Error desconocido";

        createEmailLog(
            env.NOTIFY_EMAIL,
            subject,
            "failed",
            message
        );

        console.error("Error enviando email:", error);
    }
}