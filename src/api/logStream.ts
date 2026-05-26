import type { Response } from "express";

type LogLevel = "info" | "warn" | "error";

type LogEvent = {
    level: LogLevel;
    message: string;
    createdAt: string;
};

/**
 * Clientes conectados actualmente al stream SSE
 */
const clients = new Set<Response>();

/**
 * 
 * @param res Abre una conexión SSE para enviar logs en tiempo real al dashboard
 */
export function streamLogs(res: Response): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write(`data: ${JSON.stringify({
        level: "info",
        message: "Conectado al stream de logs",
        createdAt: new Date().toISOString(),
    })}\n\n`);

    clients.add(res);

    res.on("close", () => {
        clients.delete(res);
    });
}

/**
 * Envía un log en tiempo real a todos los clientes conectados
 * @param level 
 * @param message 
 */
export function pushLog(level: LogLevel, message: string): void {
    const event: LogEvent = {
        level,
        message,
        createdAt: new Date().toISOString(),
    };

    for (const client of clients) {
        client.write(`data: ${JSON.stringify(event)}\n\n`);
    }
}