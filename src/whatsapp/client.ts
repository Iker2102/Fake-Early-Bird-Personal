import qrcode from "qrcode-terminal";
import QRCode from "qrcode";

import pkg from "whatsapp-web.js";

import { env } from "../config/env.js";

const { Client, LocalAuth } = pkg;

/**
 * Instancia global del cliente de WhatsApp Web
 */
export let whatsappClient: InstanceType<typeof Client> | null = null;

/**
 * Evita inicializaciones duplicadas del cliente
 */
let isInitializing = false;

/**
 * Último QR generado en formato Data URL.
 * Se utiliza para mostrar el QR en el dashboard
 */
let currentQr: string | null = null;

/**
 * Estado actual del cliente de WhatsApp
 */
let whatsappStatus = "initializing";

let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;

/**
 * Crea e inicializa el cliente principal de WhatsApp Web.
 *
 * El sistema utiliza LocalAuth para mantener la sesión persistente
 * y evitar escanear el QR en cada reinicio de la aplicación
 */
export async function initializeWhatsAppClient(): Promise<void> {
    if (whatsappClient || isInitializing) {
        console.log("WhatsApp ya está inicializado o inicializándose");
        return;
    }

    isInitializing = true;

    whatsappClient = new Client({
        authStrategy: new LocalAuth({
            dataPath: env.WA_SESSION_PATH,
    }),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
        ],
    },
});

/**
 * Evento lanzado cuando WhatsApp genera un nuevo QR
 */
whatsappClient.on("qr", async (qr) => {
    whatsappStatus = "qr";

    console.log("Escanea este QR con WhatsApp:");

    qrcode.generate(qr, {
        small: true,
    });

    currentQr = await QRCode.toDataURL(qr);
});

/**
 * Evento lanzado cuando la sesión ha sido autenticada correctamente
 */
whatsappClient.on("authenticated", () => {
    whatsappStatus = "authenticated";
    currentQr = null;

    console.log("WhatsApp autenticado correctamente");
});

/**
 * Evento lanzado cuando el cliente esta completamente listo
 */
whatsappClient.on("ready", () => {
    whatsappStatus = "ready";
    currentQr = null;
    reconnectAttempts = 0;

    console.log("WhatsApp conectado y listo");
});

/**
 * Evento lanzado cuando ocurre un fallo de autenticación
 */
whatsappClient.on("auth_failure", (message) => {
    whatsappStatus = "auth_failure";
    console.error("Error de autenticación:", message);
    scheduleReconnect();
});

/**
 * Evento lanzado cuando WhatsApp se desconecta
 */
whatsappClient.on("disconnected", async (reason) => {
    whatsappStatus = "disconnected";
    currentQr = null;

    console.warn("WhatsApp desconectado:", reason);

    await destroyWhatsAppClient();
    scheduleReconnect();   
});

    try {
        await whatsappClient.initialize();
    } catch (error) {
        console.error("Error inicializando WhatsApp:", error);

        await destroyWhatsAppClient();

        throw error;
    } finally {
        isInitializing = false;
    }
}

/**
 * Cierra correctamente el cliente de WhatsApp y libera Puppeteer
 * @returns 
 */
export async function destroyWhatsAppClient(): Promise<void> {
    if (!whatsappClient) {
        return;
    }

    try {
        await whatsappClient.destroy();
    } catch (error) {
        console.error("Error cerrando cliente de WhatsApp:", error);
    } finally {
        whatsappClient = null;
        isInitializing = false;
    }
}

/**
 * Devuelve el estado actual de WhatsApp y el QR activo si existe
 * @returns 
 */
export function getWhatsAppStatus() {
    return {
        status: whatsappStatus,
        qr: currentQr,
    };
}

/**
 * Programa una reconexión automática usando backoff exponencial
 * @returns 
 */
function scheduleReconnect(): void {
    if (reconnectAttempts >= env.WA_RECONNECT_MAX_ATTEMPTS) {
        console.error("Número máximo de intentos de reconexión alcanzado");
        return;
    }

    reconnectAttempts++;

    const delayMs =
        env.WA_RECONNECT_BASE_DELAY_SECONDS * 1000 * Math.pow(2, reconnectAttempts - 1);

    console.log(`Reintentando conexión de WhatsApp en ${delayMs / 1000} segundos...`);

    reconnectTimeout = setTimeout(async () => {
        try {
            await initializeWhatsAppClient();
        } catch (error) {
            console.error("Error durante la reconexión de WhatsApp:", error);
            scheduleReconnect();
        }
    }, delayMs);
}