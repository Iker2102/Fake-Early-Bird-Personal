import dotenv from "dotenv";

dotenv.config();


/**
 *  Obtengo la variable de entorno obligatoria y lanza error si no existe o esta vacía
 * @param name 
 * @returns 
 */
function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value || value.trim() === "") {
        throw new Error(`Falta la variable de entorno requerida: ${name}`);
    }

    return value;
}

/**
 * Obtengo una variable de entorno numérica, puede dar un valor por defecto si no existe
 * @param name 
 * @param defaultValue 
 * @returns 
 */
function getNumberEnv(name: string, defaultValue?: number): number {
    const rawValue = process.env[name];

    if (!rawValue && defaultValue !== undefined) {
        return defaultValue;
    }

    if (!rawValue) {
        throw new Error(`Falta la variable de entorno requerida: ${name}`);
    }

    const value = Number(rawValue);

    if (Number.isNaN(value)) {
        throw new Error(`La variable de entorno ${name} debe ser un número`);
    }

    return value;
}


/**
 * Configuración centralizada con las variables de entorno
 * Tadas las variables se validan al arrancar la aplicación
 */
export const env = {
    PORT: getNumberEnv("PORT", 3000),
    DB_PATH: requireEnv("DB_PATH"),
    WA_SESSION_PATH: requireEnv("WA_SESSION_PATH"),
    WA_RECONNECT_MAX_ATTEMPTS: getNumberEnv("WA_RECONNECT_MAX_ATTEMPTS", 5),
    WA_RECONNECT_BASE_DELAY_SECONDS: getNumberEnv("WA_RECONNECT_BASE_DELAY_SECONDS", 5),
    TZ: requireEnv("TZ"),
    WORK_HOURS_START: getNumberEnv("WORK_HOURS_START", 8),
    WORK_HOURS_END: getNumberEnv("WORK_HOURS_END", 19),
    HOLIDAYS: requireEnv("HOLIDAYS").split(",").map((holiday) => holiday.trim()).filter(Boolean),
    SMTP_HOST: requireEnv("SMTP_HOST"),
    SMTP_PORT: getNumberEnv("SMTP_PORT", 465),
    SMTP_SECURE: getBooleanEnv("SMTP_SECURE", true),

    SMTP_USER: requireEnv("SMTP_USER"),
    SMTP_PASS: requireEnv("SMTP_PASS"),
    SMTP_FROM: requireEnv("SMTP_FROM"),

    NOTIFY_EMAIL: requireEnv("NOTIFY_EMAIL"),
    NOTIFY_ON_DISCONNECT: getBooleanEnv("NOTIFY_ON_DISCONNECT", true),

    WA_ENABLED: getBooleanEnv("WA_ENABLED", true),
    
    RANDOM_DELAY_MIN_SECONDS: getNumberEnv("RANDOM_DELAY_MIN_SECONDS", 30),
    RANDOM_DELAY_MAX_SECONDS: getNumberEnv("RANDOM_DELAY_MAX_SECONDS", 180),
    TYPING_BASE_DELAY_MS: getNumberEnv("TYPING_BASE_DELAY_MS", 1000),
    TYPING_MS_PER_CHAR: getNumberEnv("TYPING_MS_PER_CHAR", 40),

    CONTACT_COOLDOWN_MINUTES: getNumberEnv("CONTACT_COOLDOWN_MINUTES", 10),
    MAX_MESSAGES_PER_CONTACT_PER_DAY: getNumberEnv("MAX_MESSAGES_PER_CONTACT_PER_DAY", 3),
    SCHEDULE_VARIATION_MINUTES: getNumberEnv("SCHEDULE_VARIATION_MINUTES", 5),

    DELIVERY_TIMEOUT_MINUTES: getNumberEnv("DELIVERY_TIMEOUT_MINUTES", 10),

    RETRY_MAX: getNumberEnv("RETRY_MAX", 3),

    NOTIFY_ON_SUCCESS: getBooleanEnv("NOTIFY_ON_SUCCESS", false),

    LOG_LEVEL: getLogLevelEnv(),
};


/**
 * Obtiene una variable de entorno booleana
 * @param name 
 * @param defaultValue 
 * @returns 
 */
function getBooleanEnv(name: string, defaultValue?: boolean): boolean {
    const rawValue = process.env[name];

    if (!rawValue && defaultValue !== undefined) {
        return defaultValue;
    }

    if (!rawValue) {
        throw new Error(`Falta la variable de entorno requerida: ${name}`);
    }

    return rawValue === "true";
}

/**
 * Obtiene una variable de entorno de tipo String
 * @param name 
 * @param defaultValue 
 * @returns 
 */
function getStringEnv(name: string, defaultValue?: string): string {
    const value = process.env[name];

    if (!value && defaultValue !== undefined) {
        return defaultValue;
    }

    if (!value) {
        throw new Error(`Falta la variable de entorno requerida: ${name}`);
    }

    return value;
}

/**
 * Filtra para los valores permitidos del LOG_LEVELw
 * @returns 
 */
function getLogLevelEnv(): string {
    const value = process.env.LOG_LEVEL ?? "info";

    const allowed = ["trace", "debug", "info", "warn", "error", "fatal"];

    if (!allowed.includes(value)) {
        throw new Error(
            `LOG_LEVEL inválido. Valores permitidos: ${allowed.join(", ")}`
        );
    }

    return value;
}