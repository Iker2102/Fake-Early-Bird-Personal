import { database } from "./database.js";

interface TableColumn {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | number | null;
    pk: number;
}

/**
 * Añade una columna a una tabla si todavía no existe.
 */
function addColumnIfNotExists(tableName: string, columnName: string, definition: string): void {
    const tableInfo = database.prepare(`PRAGMA table_info(${tableName})`).all() as TableColumn[];

    const columnExists = tableInfo.some((column) => column.name === columnName);

    if (columnExists) {
        return;
    }

    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);

    console.log(`Columna ${columnName} añadida correctamente a ${tableName}`);
}

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

    addColumnIfNotExists("scheduled_messages", "whatsappMessageId", "TEXT");

    console.log("Database schema initialized");
}