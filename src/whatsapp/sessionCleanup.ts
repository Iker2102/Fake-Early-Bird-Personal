import fs from "fs";
import path from "path";

import { env } from "../config/env.js";
import { logWarn } from "../shared/logger.js";

function deleteSingletonLocks(directory: string): void {
    if (!fs.existsSync(directory)) {
        return;
    }

    const entries = fs.readdirSync(directory, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            deleteSingletonLocks(entryPath);
            continue;
        }

        if (!entry.name.startsWith("Singleton")) {
            continue;
        }

        try {
            fs.rmSync(entryPath, {
                force: true,
            });

            logWarn(`Lock Chromium eliminado: ${entryPath}`);
        } catch (error) {
            logWarn(`No se pudo eliminar lock Chromium: ${entryPath}`, error);
        }
    }
}

/**
 * Elimina locks antiguos de Chromium dentro del perfil de WhatsApp Web.
 */
export function cleanupWhatsAppSessionLocks(): void {
    deleteSingletonLocks(path.resolve(env.WA_SESSION_PATH));
    deleteSingletonLocks(path.resolve(".wwebjs_cache"));
}