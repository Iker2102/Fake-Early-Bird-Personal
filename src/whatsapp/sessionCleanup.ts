import fs from "fs";
import path from "path";

import { env } from "../config/env.js";

const CHROMIUM_LOCK_FILES = [
    "SingletonLock",
    "SingletonCookie",
    "SingletonSocket",
];

/**
 * Elimina locks antiguos de Chromium dentro del perfil de WhatsApp Web
 */
export function cleanupWhatsAppSessionLocks(): void {
    const sessionPath = path.resolve(env.WA_SESSION_PATH, "session");

    for (const lockFile of CHROMIUM_LOCK_FILES) {
        const lockPath = path.join(sessionPath, lockFile);

        try {
            if (fs.existsSync(lockPath)) {
                fs.rmSync(lockPath, {
                    force: true,
                });

                console.warn(`Lock antiguo eliminado: ${lockPath}`);
            }
        } catch (error) {
            console.warn(`No se pudo eliminar lock ${lockPath}:`, error);
        }
    }
}