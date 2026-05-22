import cron from "node-cron";

import { createDatabaseBackup } from "../db/backup.js";



/**
 * Inicia el backup diario de la base de datos
 */
export function startBackupScheduler(): void {
    cron.schedule("0 3 * * *", () =>  {
        createDatabaseBackup();
    });

    console.log("Backup diario programado");
}