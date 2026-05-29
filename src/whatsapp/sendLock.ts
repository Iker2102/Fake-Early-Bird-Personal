import { AsyncLock } from "../shared/asynLock.js";

/**
 * Lock global para limitar los envíos de WhatsApp a 1 simultáneo
 */
export const whatsappSendLock = new AsyncLock();