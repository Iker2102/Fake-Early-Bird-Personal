import { env } from "../config/env.js";

import fs from "fs";

import path from "path";
import { logInfo, logWarn } from "../shared/logger.js";


/**
 * Crea una copia de seguridad de la base de datos SQLite
 * @returns 
 */
export function createDatabaseBackup(): void {
    if(!fs.existsSync(env.DB_PATH)) {
        logWarn("No se ha podido crear backup: La base de datos no existe");
        return;
    }

    const backupDir = path.resolve("data", "backups");

    fs.mkdirSync(backupDir, {
        recursive: true,
    });


    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

    const backupPath = path.join(backupDir, `app-${timestamp}.db.bak`);

    fs.copyFileSync(env.DB_PATH, backupPath);

    logInfo(`Backup creado: ${backupPath}`);
}