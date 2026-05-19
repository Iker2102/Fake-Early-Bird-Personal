import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

import { env } from "../config/env.js";

const { Client, LocalAuth } = pkg;

let whatsappClient: InstanceType<typeof Client> | null = null;
let isInitializing = false;

/**
 * Crea e inicializa el cliente de WhatsApp Web
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
        },
    });

    whatsappClient.on("qr", (qr) => {
        console.log("Escanea este QR con WhatsApp:");
        qrcode.generate(qr, { small: true });
    });

    whatsappClient.on("authenticated", () => {
        console.log("WhatsApp autenticado correctamente");
    });

    whatsappClient.on("ready", () => {
        console.log("WhatsApp conectado y listo");
    });

    whatsappClient.on("auth_failure", (message) => {
        console.error("Error de autenticación:", message);
    });

    whatsappClient.on("disconnected", async (reason) => {
        console.warn("WhatsApp desconectado:", reason);
        await destroyWhatsAppClient();
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