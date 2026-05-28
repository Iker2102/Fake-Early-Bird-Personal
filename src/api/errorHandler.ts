import type { NextFunction, Request, Response } from "express";

import { ValidationError } from "../utils/validators.js";

export function errorHandler(
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (error instanceof ValidationError) {
        res.status(400).json({
            error: error.message,
        });
        return;
    }

    console.error("Error no controlado:", error);

    res.status(500).json({
        error: "Error interno del servidor",
    });
}