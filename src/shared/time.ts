/**
 * Pausa la ejecución durante una cantidad concreta de milisegundos
 * @param ms 
 * @returns 
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Devuelve un número aleatorio entre un mínimo y un máximo
 * @param min 
 * @param max 
 * @returns 
 */
export function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}