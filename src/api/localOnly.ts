import type { Request, Response, NextFunction } from "express";
import { error } from "node:console";


export function localOnly(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip ?? req.socket.remoteAddress ?? "";

    const allowedIps = [
        "127.0.0.1",
        "::1",
        "::ffff:127.0.0.1",
    ];

    if(!allowedIps.includes(ip)) {
        res.status(403).json({
            error: "Acceso permitido solo desde localhost",
        });
        return;
    }

    next();
}