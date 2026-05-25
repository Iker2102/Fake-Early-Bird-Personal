import type { Request, Response, NextFunction } from "express";

/**
 * Restringe el acceso de la API/dashboard a conexiones locales
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export function localOnly(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const ip = req.ip ?? req.socket.remoteAddress ?? "";

    const isLocal =
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.startsWith("::ffff:127.") ||
        ip.startsWith("::ffff:172.") ||
        ip.startsWith("172.");

    if (!isLocal) {
        res.status(403).json({
            error: "Acceso permitido solo desde localhost",
        });

        return;
    }

    next();
}