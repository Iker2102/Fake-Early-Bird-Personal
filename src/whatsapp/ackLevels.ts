
/**
 * Niveles ACK de Whatsapp web
 */
export const ACK_LEVELS = {
    PENDING: 0,
    SERVER: 1,
    DEVICE: 2,
    READ: 3,
    PLAYED: 4,
} as const;


/**
 * Devuelve una etiqueta legible para un nivel ACK
 * @param ack 
 * @returns 
 */
export function getAckLabel(ack: number): string {
    switch (ack) {
        case ACK_LEVELS.PENDING:
            return "pending";
        case ACK_LEVELS.SERVER:
            return "server";
        case ACK_LEVELS.DEVICE:
            return "device";
        case ACK_LEVELS.READ:
            return "read";
        case ACK_LEVELS.PLAYED:
            return "played";
        default:
            return "unknown";
    }
}