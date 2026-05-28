import fs from "fs";
import path from "path";

import { env } from "../config/env.js";
import { logWarn } from "../shared/logger.js";

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

                logWarn(`Lock antiguo eliminado: ${lockPath}`);
            }
        } catch (error) {
            logWarn(`No se pudo eliminar lock ${lockPath}:`, error);
        }
    }
}