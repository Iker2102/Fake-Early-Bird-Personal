import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import { emailQueue } from "../email/mailer.js";

import pkg from "whatsapp-web.js";

import { env } from "../config/env.js";

import { sendDisconnectAlertEmail } from "../email/mailer.js";

import { countPendingMessages } from "../db/repositories/scheduledMessageRepository.js";

const { Client, LocalAuth } = pkg;

import { registerAckWatcher, resetAckWatcher } from "./ackWatcher.js";

import { cleanupWhatsAppSessionLocks } from "./sessionCleanup.js";

import { killOrphanChromiumProcesses } from "./chromiumCleanup.js";
import { logError, logInfo, logWarn } from "../shared/logger.js";


let isWhatsAppReady = false;

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
        logInfo("WhatsApp ya está inicializado o inicializándose");
        return;
    }

    isInitializing = true;

    await killOrphanChromiumProcesses();

    cleanupWhatsAppSessionLocks();

    whatsappClient = new Client({
        authStrategy: new LocalAuth({
            dataPath: env.WA_SESSION_PATH,
    }),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--disable-extensions",
        ],
    },
});

registerAckWatcher(whatsappClient);

/**
 * Evento lanzado cuando WhatsApp genera un nuevo QR
 */
whatsappClient.on("qr", async (qr) => {
    whatsappStatus = "qr";

    logInfo("Escanea este QR con WhatsApp:");

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

    logInfo("WhatsApp autenticado correctamente");
});

/**
 * Evento lanzado cuando el cliente esta completamente listo
 */
whatsappClient.on("ready", () => {
    if(isWhatsAppReady) {
        return;
    }
    
    whatsappStatus = "ready";
    currentQr = null;
    reconnectAttempts = 0;
    isWhatsAppReady = true;

    logInfo("WhatsApp conectado y listo");
});

/**
 * Evento lanzado cuando ocurre un fallo de autenticación
 */
whatsappClient.on("auth_failure", async (message) => {
    whatsappStatus = "auth_failure";
    isWhatsAppReady = false;

    const pendingMessages = countPendingMessages();

    if (pendingMessages > 0) {
        sendDisconnectAlertEmail(`auth_failure: ${message}`, pendingMessages);
    }

    logError("Error de autenticación:", message);


    scheduleReconnect();
});

/**
 * Evento lanzado cuando WhatsApp se desconecta
 */
whatsappClient.on("disconnected", async (reason) => {
    whatsappStatus = "disconnected";
    currentQr = null;
    isWhatsAppReady = false;

    const pendingMessages = countPendingMessages();

    if (pendingMessages > 0) {
        sendDisconnectAlertEmail(reason, pendingMessages);
    }

    logWarn("WhatsApp desconectado:", reason);

    await destroyWhatsAppClient();
    scheduleReconnect();   
});

try {
    await whatsappClient.initialize();
} catch (error) {

    const errorMessage =
        error instanceof Error ? error.message : String(error);

    whatsappStatus = "error";
    isWhatsAppReady = false;

    logError("Error inicializando WhatsApp:", error);

    /**
     * Error de permisos en Linux/macOS
     */
    if (errorMessage.includes("EACCES")) {
        whatsappClient = null;
        isInitializing = false;

        logError("Error de permisos en la sesión de WhatsApp. Revisa .wwebjs_auth.");

        return;
    }

    /**
     * Perfil Chromium bloqueado por procesos antiguos
     */
    const isProfileLockedError =
        errorMessage.includes("profile appears to be in use") ||
        errorMessage.includes("process_singleton") ||
        errorMessage.includes("Code: 21") ||
        errorMessage.includes("Code: 70") ||
        errorMessage.includes("Code: 71");

    if (isProfileLockedError) {
        logWarn("Perfil Chromium bloqueado. Limpiando procesos y locks...");

        await killOrphanChromiumProcesses();

        cleanupWhatsAppSessionLocks();
    }

    /**
     * Para otros errores sí intentamos reconectar
     */
    await destroyWhatsAppClient();

    scheduleReconnect();

} finally {
    isInitializing = false;
}

}



/**
 * Programa una reconexión automática usando backoff exponencial
 * @returns 
 */
function scheduleReconnect(): void {
    if (reconnectTimeout) {
        return;
    }

    if (reconnectAttempts >= env.WA_RECONNECT_MAX_ATTEMPTS) {
        logError("Número máximo de intentos de reconexión alcanzado");
        return;
    }

    reconnectAttempts++;

    const delayMs =
        env.WA_RECONNECT_BASE_DELAY_SECONDS * 1000 * Math.pow(2, reconnectAttempts - 1);

    logInfo(`Reintentando conexión de WhatsApp en ${delayMs / 1000} segundos...`);

    reconnectTimeout = setTimeout(async () => {
        reconnectTimeout = null;

        try {
            await initializeWhatsAppClient();
        } catch (error) {
            logError("Error durante la reconexión de WhatsApp:", error);
            scheduleReconnect();
        }
    }, delayMs);
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
        await Promise.race([
            whatsappClient.destroy(),
            new Promise((resolve) => setTimeout(resolve, 10000))
        ]);
    } catch (error) {
        logError("Error cerrando cliente de WhatsApp:", error);
    } finally {
        whatsappClient = null;
        isInitializing = false;
        isWhatsAppReady = false;
        resetAckWatcher();
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

export function isClientReady(): boolean {
    return Boolean(whatsappClient && isWhatsAppReady);
}