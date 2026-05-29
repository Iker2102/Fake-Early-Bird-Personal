/**
 * Lock asíncrono simple para evitar ejecutar varias tareas críticas a la vez
 */
export class AsyncLock {
    private current: Promise<void> = Promise.resolve();

    async runExclusive<T>(task: () => Promise<T>): Promise<T> {
        const previous = this.current;

        let release!: () => void;

        this.current = new Promise<void>((resolve) => {
            release = resolve;
        });

        await previous;

        try {
            return await task();
        } finally {
            release();
        }
    }
}