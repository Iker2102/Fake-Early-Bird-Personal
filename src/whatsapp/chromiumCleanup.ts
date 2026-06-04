import fs from "fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logWarn } from "../shared/logger.js";

const execFileAsync = promisify(execFile);

function isRunningInDocker(): boolean {
    return (
        process.env.RUNNING_IN_DOCKER === "true" ||
        fs.existsSync("/.dockerenv")
    );
}

/**
 * Mata procesos Chromium huérfanos lanzados por Puppeteer.
 */
export async function killOrphanChromiumProcesses(): Promise<void> {
    if (!isRunningInDocker()) {
        return;
    }

    try {
        const { stdout } = await execFileAsync("ps", ["aux"]);

        const lines = stdout
            .split("\n")
            .filter(
                (line) =>
                    (
                        line.includes("chrome") ||
                        line.includes("chromium")
                    ) &&
                    !line.includes("grep") &&
                    !line.includes("node")
            );

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);

            const pid = parts[1];

            if (!pid) {
                continue;
            }

            try {
                process.kill(Number(pid), "SIGKILL");

                logWarn(`Proceso Chromium eliminado (PID=${pid})`);
            } catch (error) {
                logWarn(`No se pudo eliminar proceso Chromium PID=${pid}`, error);
            }
        }
    } catch (error) {
        logWarn("No se pudieron limpiar procesos Chromium:", error);
    }
}