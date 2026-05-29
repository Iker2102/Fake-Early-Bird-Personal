import { describe, expect, it } from "vitest";

import { AsyncLock } from "../../src/shared/asynLock.ts";

describe("AsyncLock", () => {
    it("ejecuta tareas de forma secuencial", async () => {
        const lock = new AsyncLock();
        const result: number[] = [];

        await Promise.all([
            lock.runExclusive(async () => {
                await new Promise((resolve) => setTimeout(resolve, 30));
                result.push(1);
            }),

            lock.runExclusive(async () => {
                result.push(2);
            }),
        ]);

        expect(result).toEqual([1, 2]);
    });

    it("libera el lock aunque una tarea falle", async () => {
        const lock = new AsyncLock();
        const result: string[] = [];

        await expect(
            lock.runExclusive(async () => {
                result.push("first");
                throw new Error("boom");
            })
        ).rejects.toThrow("boom");

        await lock.runExclusive(async () => {
            result.push("second");
        });

        expect(result).toEqual(["first", "second"]);
    });
});