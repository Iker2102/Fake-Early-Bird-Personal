import { logError, logInfo } from "../shared/logger.js";

export interface EmailJob {
    id: string;
    to: string;
    subject: string;
    html: string;
    attempts: number;
    createdAt: Date;
}

export type SendMailFn = (job: EmailJob) => Promise<void>;
export type EmailLogFn = (
    recipient: string,
    subject: string,
    status: string,
    errorMessage?: string
) => void;

export interface EmailQueueOptions {
    maxAttempts: number;
    retryDelaysMs: number[];
    pollIntervalMs: number;
    sendMail: SendMailFn;
    createEmailLog: EmailLogFn;
}

export class EmailQueue {
    private queue: EmailJob[] = [];
    private isRunning = false;
    private workerTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private readonly options: EmailQueueOptions) {}

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

        logInfo(`[EmailQueue] Job encolado`);

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

        logInfo("[EmailQueue] Worker detenido");
    }

    private startWorker(): void {
        this.isRunning = true;

        logInfo("[EmailQueue] Worker arrancado");

        this.scheduleNextTick();
    }

    private scheduleNextTick(): void {
        this.workerTimer = setTimeout(() => {
            void this.tick();
        }, this.options.pollIntervalMs);
    }

    private async tick(): Promise<void> {
        if (this.queue.length === 0) {
            this.isRunning = false;
            this.workerTimer = null;

            logInfo("[EmailQueue] Cola vacía, worker en espera");

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

    private async processJob(job: EmailJob): Promise<void> {
        job.attempts++;

        logInfo(
            `[EmailQueue] Enviando job intento ${job.attempts}/${this.options.maxAttempts}`
        );

        try {
            await this.options.sendMail(job);

            this.options.createEmailLog(job.to, job.subject, "sent");

            logInfo("[EmailQueue] Email enviado");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Error desconocido";

            logError("[EmailQueue] Fallo al enviar email", message);

            if (job.attempts < this.options.maxAttempts) {
                const retryDelayMs =
                    this.options.retryDelaysMs[job.attempts - 1] ??
                    this.options.retryDelaysMs[this.options.retryDelaysMs.length - 1];

                logInfo(
                    `[EmailQueue] Reintento ${job.attempts + 1}/${this.options.maxAttempts}`
                );

                setTimeout(() => {
                    this.queue.unshift(job);

                    if (!this.isRunning) {
                        this.startWorker();
                    }
                }, retryDelayMs);

                return;
            }

            this.options.createEmailLog(job.to, job.subject, "failed", message);

            logError(
                `[EmailQueue] Job descartado tras ${this.options.maxAttempts} intentos`
            );
        }
    }
}