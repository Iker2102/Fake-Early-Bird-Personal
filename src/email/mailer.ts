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

interface EmailJob {
    id: string;
    to: string;
    subject: string;
    html: string;
    attempts: number;
    createdAt: Date;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5_000;
const POLL_INTERVAL_MS = 1_000;

class EmailQueue {
    private queue: EmailJob[] = [];
    private isRunning = false;
    private workerTimer: ReturnType<typeof setTimeout> | null = null;

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
        console.log(`[EmailQueue] Job encolado (id=${job.id}, total=${this.queue.length})`);

        if (!this.isRunning) {
            this.startWorker();
        }
    }

    stop(): void {
        if (this.workerTimer) {
            clearTimeout(this.workerTimer);
            this.workerTimer = null;
        }
        this.isRunning = false;
        console.log("[EmailQueue] Worker detenido");
    }

    private startWorker(): void {
        this.isRunning = true;
        console.log("[EmailQueue] worker arrancado");
        this.scheduleNextTick();
    }

    private scheduleNextTick(): void {
        this.workerTimer = setTimeout(() => this.tick(), POLL_INTERVAL_MS);
    }

    private async tick(): Promise<void> {
        if (this.queue.length === 0) {
            this.isRunning = false;
            console.log("[EmailQueue] Cola vacía, worker en espera");
            return;
        }

        const job = this.queue.shift()!;
        await this.processJob(job);

        this.scheduleNextTick();
    }

    private async processJob(job: EmailJob): Promise<void> {
        job.attempts++;
        console.log(
            `[EmailQueue] Enviando job id=${job.id} (intentando ${job.attempts}/${MAX_ATTEMPTS})`
        );

        try {
            await transporter.sendMail({
                from: env.SMTP_FROM,
                to: job.to,
                subject: job.subject,
                html: job.html,
            });

            createEmailLog(job.to, job.subject, "sent");
            console.log(`[EmailQueue] Email Enviado (id=${job.id})`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            console.error(`[EmailQueue] Fallo al enviar id=${job.id}: ${message}`);

            if (job.attempts < MAX_ATTEMPTS) {
                console.log(
                    `[EmailQueue] Reintento ${job.attempts + 1}/${MAX_ATTEMPTS} en ${RETRY_DELAY_MS / 1000}s`
                );
                setTimeout(() => {
                    this.queue.unshift(job);
                    if (!this.isRunning) this.startWorker();
                }, RETRY_DELAY_MS);
            } else {
                createEmailLog(job.to, job.subject, "failed", message);
                console.error(`[EmailQueue] Job id=${job.id} descartado tras ${MAX_ATTEMPTS} intentos`);
            }
        }
    }
}

export const emailQueue = new EmailQueue();

export function sendDisconnectAlertEmail(
    reason: string,
    pendingMessagesCount: number
): void {
    if (!env.NOTIFY_ON_DISCONNECT) return;

    const subject = "Fake Early Bird - Whatsapp desconectado";
    const html = `
        <h1>Whatsapp desconectado</h1>
        <p><strong>Motivo:</strong> ${reason}</p>
        <p>
            Hay <strong>${pendingMessagesCount}</strong>
            mensaje pendientes en cola.
        </p>
        <p>
            Revisa el dashboard para volver a conectar la sesión.
        </p>
    `;

    emailQueue.enqueue(env.NOTIFY_EMAIL, subject, html);
}