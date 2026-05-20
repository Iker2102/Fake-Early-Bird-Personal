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
};