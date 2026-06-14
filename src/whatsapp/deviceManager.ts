import pkg from "whatsapp-web.js";

import { env } from "../config/env.js";
import { logError, logInfo, logWarn } from "../shared/logger.js";

import { registerAckWatcher } from "./ackWatcher.js";
import { cleanupWhatsAppSessionLocks } from "./sessionCleanup.js";
import { killOrphanChromiumProcesses } from "./chromiumCleanup.js";

const { Client, LocalAuth } = pkg;

export type WhatsAppDeviceStatus =
    | "initializing"
    | "qr"
    | "authenticated"
    | "ready"
    | "disconnected"
    | "auth_failure"
    | "error";

export type WhatsAppDevice = {
    id: string;
    name: string;
    client: InstanceType<typeof Client> | null;
    status: WhatsAppDeviceStatus;
    qr: string | null;
    isReady: boolean;
    isInitializing: boolean;
};

const devices = new Map<string, WhatsAppDevice>();

export function getDevices(): WhatsAppDevice[] {
    return Array.from(devices.values());
}

export function getDevice(deviceId: string): WhatsAppDevice | null {
    return devices.get(deviceId) ?? null;
}

export function isDeviceReady(deviceId: string): boolean {
    const device = getDevice(deviceId);

    return Boolean(device?.client && device.isReady);
}

export function getDeviceClient(deviceId: string): InstanceType<typeof Client> | null {
    return getDevice(deviceId)?.client ?? null;
}

export async function initializeDevice(deviceId: string, name = deviceId): Promise<void> {
    let device = devices.get(deviceId);

    if (device?.client || device?.isInitializing) {
        logInfo(`Dispositivo ${deviceId} ya está inicializado o inicializándose`);
        return;
    }

    device = {
        id: deviceId,
        name,
        client: null,
        status: "initializing",
        qr: null,
        isReady: false,
        isInitializing: true,
    };

    devices.set(deviceId, device);

    await killOrphanChromiumProcesses();
    cleanupWhatsAppSessionLocks();

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: deviceId,
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

    device.client = client;

    registerAckWatcher(client);

    client.on("qr", (qr) => {
        device.status = "qr";
        device.qr = qr;

        logInfo(`QR generado para dispositivo ${deviceId}`);
    });

    client.on("authenticated", () => {
        device.status = "authenticated";
        device.qr = null;

        logInfo(`Dispositivo ${deviceId} autenticado`);
    });

    client.on("ready", () => {
        device.status = "ready";
        device.qr = null;
        device.isReady = true;

        logInfo(`Dispositivo ${deviceId} conectado y listo`);
    });

    client.on("auth_failure", (message) => {
        device.status = "auth_failure";
        device.isReady = false;

        logError(`Fallo de autenticación en ${deviceId}:`, message);
    });

    client.on("disconnected", async (reason) => {
        device.status = "disconnected";
        device.isReady = false;
        device.qr = null;

        logWarn(`Dispositivo ${deviceId} desconectado:`, reason);

        await destroyDevice(deviceId);
    });

    try {
        await client.initialize();
    } catch (error) {
        device.status = "error";
        device.isReady = false;

        logError(`Error inicializando dispositivo ${deviceId}:`, error);

        await destroyDevice(deviceId);
    } finally {
        device.isInitializing = false;
    }
}

export async function destroyDevice(deviceId: string): Promise<void> {
    const device = devices.get(deviceId);

    if (!device?.client) {
        return;
    }

    try {
        await Promise.race([
            device.client.destroy(),
            new Promise((resolve) => setTimeout(resolve, 10000)),
        ]);
    } catch (error) {
        logError(`Error cerrando dispositivo ${deviceId}:`, error);
    } finally {
        device.client = null;
        device.isReady = false;
        device.isInitializing = false;
    }
}