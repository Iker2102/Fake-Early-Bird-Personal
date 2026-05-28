import cron from "node-cron";

import { createDatabaseBackup } from "../db/backup.js";
import { logInfo } from "../shared/logger.js";



/**
 * Inicia el backup diario de la base de datos
 */
export function startBackupScheduler(): void {
    cron.schedule("0 3 * * *", () =>  {
        createDatabaseBackup();
    });

    logInfo("Backup diario programado");
}