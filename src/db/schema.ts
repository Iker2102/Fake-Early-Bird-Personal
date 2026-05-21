import { database } from "./database.js";

/**
 * Crea las tablas principales de la aplicación.
 */
export function initializeDatabase(): void {
    database.exec(`
        CREATE TABLE IF NOT EXISTS scheduled_messages (
            id TEXT PRIMARY KEY,

            phone TEXT NOT NULL,
            contactName TEXT,

            message TEXT NOT NULL,

            scheduledAt TEXT NOT NULL,

            status TEXT NOT NULL,

            createdAt TEXT NOT NULL,
            sentAt TEXT,
            deliveredAt TEXT,

            ackLevel INTEGER,

            retryCount INTEGER DEFAULT 0,

            notifiedAt TEXT,

            failReason TEXT,

            whatsappMessageId TEXT
        );

        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,

            name TEXT NOT NULL,

            phone TEXT NOT NULL UNIQUE,

            tags TEXT,

            priority TEXT DEFAULT 'normal',

            lastInteraction TEXT
        );

        CREATE TABLE IF NOT EXISTS email_logs (
            id TEXT PRIMARY KEY,

            recipient TEXT NOT NULL,

            subject TEXT NOT NULL,

            status TEXT NOT NULL,

            errorMessage TEXT,

            createdAt TEXT NOT NULL
        );
    `);

    try {
        database.exec(`
            ALTER TABLE scheduled_messages
            ADD COLUMN whatsappMessageId TEXT;
        `);
    } catch (error) {
        console.warn("No se pudo añadir whatsappMessageId:", error);
    }

    console.log("Database schema initialized");
}