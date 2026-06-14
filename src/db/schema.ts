import { logInfo } from "../shared/logger.js";
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
function addColumnIfNotExists(
    tableName: string,
    columnName: string,
    definition: string
): void {
    const tableInfo = database
        .prepare(`PRAGMA table_info(${tableName})`)
        .all() as TableColumn[];

    const columnExists = tableInfo.some(
        (column) => column.name === columnName
    );

    if (columnExists) {
        return;
    }

    database.exec(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
    );

    logInfo(`Columna ${columnName} añadida correctamente a ${tableName}`);
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

            whatsappMessageId TEXT,

            lastRestryAt TEXT,

            deliveryTimeoutAt TEXT,

            updatedAt TEXT
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

            messageId TEXT,

            recipient TEXT NOT NULL,
            subject TEXT NOT NULL,

            type TEXT,
            status TEXT NOT NULL,

            sentAt TEXT,
            success INTEGER,

            error TEXT,
            errorMessage TEXT,

            createdAt TEXT NOT NULL,

            FOREIGN KEY (messageId)
                REFERENCES scheduled_messages(id)
        );
    `);

    addColumnIfNotExists(
        "scheduled_messages",
        "whatsappMessageId",
        "TEXT"
    );

    addColumnIfNotExists("email_logs", "messageId", "TEXT");
    addColumnIfNotExists("email_logs", "recipient", "TEXT");
    addColumnIfNotExists("email_logs", "subject", "TEXT");
    addColumnIfNotExists("email_logs", "type", "TEXT");
    addColumnIfNotExists("email_logs", "status", "TEXT");
    addColumnIfNotExists("email_logs", "sentAt", "TEXT");
    addColumnIfNotExists("email_logs", "success", "INTEGER");
    addColumnIfNotExists("email_logs", "error", "TEXT");
    addColumnIfNotExists("email_logs", "errorMessage", "TEXT");
    addColumnIfNotExists("email_logs", "createdAt", "TEXT");

    addColumnIfNotExists("scheduled_messages", "lastRestryAt", "TEXT");
    addColumnIfNotExists("scheduled_messages", "deliveryTimeoutAt", "TEXT");
    addColumnIfNotExists("scheduled_messages", "updatedAt", "TEXT");
    addColumnIfNotExists("scheduled_messages", "recurrence", "TEXT");
    addColumnIfNotExists("scheduled_messages", "recurrenceInterval", "INTEGER DEFAULT 1");
    addColumnIfNotExists("scheduled_messages", "parentMessageId", "TEXT");
    addColumnIfNotExists("scheduled_messages", "deviceId", "TEXT DEFAULT 'default'");




    logInfo("Database schema initialized");
}