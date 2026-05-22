import nodemailer from "nodemailer";

import { env } from "../config/env.js";
import { createEmailLog } from "../db/repositories/emailLogRepository.js";

import { renderEmailTemplate } from "./templateRenderer.js";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

interface EmailJob {
    id: string;
    to: string;
    subject: string;
    html: string;
    attempts: number;
    createdAt: Date;
}

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

        console.log("SMTP conectado correctamente");
    } catch {
        console.warn("SMTP no disponible en entorno de desarrollo");
    }
}

/**
 * Cola simple en memoria para enviar emails sin bloquear el flujo principal.
 */
class EmailQueue {
    private queue: EmailJob[] = [];
    private isRunning = false;
    private workerTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Añade un email a la cola.
     */
    enqueue(to: string, subject: string, html: string): void {
        const job: EmailJob = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            to,
            subject,
            html,
            attempts: 0,
            createdAt: new Date(),
        };

        this.queue.push(job);

        console.log(
            `[EmailQueue] Job encolado (id=${job.id}, total=${this.queue.length})`
        );

        if (!this.isRunning) {
            this.startWorker();
        }
    }

    /**
     * Detiene el worker de emails.
     */
    stop(): void {
        if (this.workerTimer) {
            clearTimeout(this.workerTimer);
            this.workerTimer = null;
        }

        this.isRunning = false;

        console.log("[EmailQueue] Worker detenido");
    }

    /**
     * Arranca el worker si hay emails pendientes.
     */
    private startWorker(): void {
        this.isRunning = true;

        console.log("[EmailQueue] Worker arrancado");

        this.scheduleNextTick();
    }

    /**
     * Programa la siguiente iteración del worker.
     */
    private scheduleNextTick(): void {
        this.workerTimer = setTimeout(() => {
            void this.tick();
        }, POLL_INTERVAL_MS);
    }

    /**
     * Procesa el siguiente email pendiente.
     */
    private async tick(): Promise<void> {
        if (this.queue.length === 0) {
            this.isRunning = false;
            this.workerTimer = null;

            console.log("[EmailQueue] Cola vacía, worker en espera");

            return;
        }

        const job = this.queue.shift();

        if (!job) {
            this.scheduleNextTick();
            return;
        }

        await this.processJob(job);

        this.scheduleNextTick();
    }

    /**
     * Envía un email y reintenta si falla.
     */
    private async processJob(job: EmailJob): Promise<void> {
        job.attempts++;

        console.log(
            `[EmailQueue] Enviando job id=${job.id} (intento ${job.attempts}/${MAX_ATTEMPTS})`
        );

        try {
            await transporter.sendMail({
                from: env.SMTP_FROM,
                to: job.to,
                subject: job.subject,
                html: job.html,
            });

            createEmailLog(job.to, job.subject, "sent");

            console.log(`[EmailQueue] Email enviado (id=${job.id})`);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Error desconocido";

            console.error(`[EmailQueue] Fallo al enviar id=${job.id}: ${message}`);

            if (job.attempts < MAX_ATTEMPTS) {
                const retryDelayMs =
                    RETRY_DELAYS_MS[job.attempts - 1] ??
                    RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];

                console.log(
                    `[EmailQueue] Reintento ${job.attempts + 1}/${MAX_ATTEMPTS} en ${
                        retryDelayMs / 1000
                    }s`
                );

                setTimeout(() => {
                    this.queue.unshift(job);

                    if (!this.isRunning) {
                        this.startWorker();
                    }
                }, retryDelayMs);

                return;
            }

            createEmailLog(job.to, job.subject, "failed", message);

            console.error(
                `[EmailQueue] Job id=${job.id} descartado tras ${MAX_ATTEMPTS} intentos`
            );
        }
    }
}

export const emailQueue = new EmailQueue();

/**
 * Encola una alerta cuando WhatsApp se desconecta y hay mensajes pendientes.
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