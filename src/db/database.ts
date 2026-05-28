import Database from "better-sqlite3";

import { env } from "../config/env.js";
import { logInfo } from "../shared/logger.js";

/**
 * Conexión principal SQLite, la conexión se reutiliza en toda la aplicación
 */
export const database = new Database(env.DB_PATH);

/**
 * Activa el modo WAL para mejorar concurrencia y estabilidad
 */
database.pragma("journal_mode = WAL");

logInfo("SMTP no disponible en entorno de desarrollo");