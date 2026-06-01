import pino from "pino";

import { env } from "../config/env.js";

const pinoLogger = pino({
    level: env.LOG_LEVEL ?? "info",

    transport:
        process.env.NODE_ENV !== "production"
            ? {
                  target: "pino-pretty",
                  options: {
                      colorize: true,
                      translateTime: true,
                  },
              }
            : undefined,
});

function sanitize(value: unknown): string {
    const text = String(value);

    return text
        .replace(/\+?[0-9]{8,15}/g, "[PHONE]")
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [TOKEN]")
        .replace(/password["']?\s*[:=]\s*["'].*?["']/gi, 'password="[HIDDEN]"')
        .replace(/"message"\s*:\s*".*?"/gi, '"message":"[HIDDEN]"');
}

export function logInfo(message: string, ...args: unknown[]): void {
    pinoLogger.info(
        [message, ...args.map((arg) => sanitize(arg))].join(" ")
    );
}

export function logWarn(message: string, ...args: unknown[]): void {
    pinoLogger.warn(
        [message, ...args.map((arg) => sanitize(arg))].join(" ")
    );
}

export function logError(message: string, ...args: unknown[]): void {
    pinoLogger.error(
        [message, ...args.map((arg) => sanitize(arg))].join(" ")
    );
}

export { pinoLogger as logger };