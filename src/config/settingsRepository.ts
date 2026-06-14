import fs from "fs";
import path from "path";

import { updateRuntimeSetting } from "./runtimeSettings.js";

export type SettingType = "string" | "number" | "boolean";

export type EditableSetting = {
    key: string;
    label: string;
    type: SettingType;
    restartRequired: boolean;
};

const ENV_PATH = path.resolve(".env");

export const editableSettings: EditableSetting[] = [
    {
        key: "WORK_HOURS_START",
        label: "Inicio horario laboral",
        type: "number",
        restartRequired: false,
    },
    {
        key: "WORK_HOURS_END",
        label: "Fin horario laboral",
        type: "number",
        restartRequired: false,
    },
    {
        key: "CONTACT_COOLDOWN_MINUTES",
        label: "Cooldown entre mensajes",
        type: "number",
        restartRequired: false,
    },
    {
        key: "MAX_MESSAGES_PER_CONTACT_PER_DAY",
        label: "Máximo de mensajes por contacto al día",
        type: "number",
        restartRequired: false,
    },
    {
        key: "SCHEDULE_VARIATION_MINUTES",
        label: "Variación horaria",
        type: "number",
        restartRequired: false,
    },
    {
        key: "DAILY_SUMMARY_ENABLED",
        label: "Resumen diario activado",
        type: "boolean",
        restartRequired: true,
    },
    {
        key: "DAILY_SUMMARY_HOUR",
        label: "Hora del resumen diario",
        type: "number",
        restartRequired: true,
    },
    {
        key: "DAILY_SUMMARY_MINUTE",
        label: "Minuto del resumen diario",
        type: "number",
        restartRequired: true,
    },
    {
        key: "NOTIFY_ON_SUCCESS",
        label: "Notificar entregas correctas",
        type: "boolean",
        restartRequired: false,
    },
    {
        key: "NOTIFY_ON_DISCONNECT",
        label: "Notificar desconexiones",
        type: "boolean",
        restartRequired: false,
    },
    {
        key: "LOG_LEVEL",
        label: "Nivel de logs",
        type: "string",
        restartRequired: false,
    },
];

function readEnvFile(): string {
    if (!fs.existsSync(ENV_PATH)) {
        return "";
    }

    return fs.readFileSync(ENV_PATH, "utf-8");
}

function parseEnv(content: string): Record<string, string> {
    const values: Record<string, string> = {};

    for (const line of content.split("\n")) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }

        const separatorIndex = trimmed.indexOf("=");

        if (separatorIndex === -1) {
            continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        values[key] = value;
    }

    return values;
}

export function getEditableSettings() {
    const envValues = parseEnv(readEnvFile());

    return editableSettings.map((setting) => ({
        ...setting,
        value: envValues[setting.key] ?? "",
    }));
}

function validateSettingValue(setting: EditableSetting, value: unknown): string {
    if (setting.type === "boolean") {
        if (value !== "true" && value !== "false" && value !== true && value !== false) {
            throw new Error(`${setting.key} debe ser true o false`);
        }

        return String(value);
    }

    if (setting.type === "number") {
        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) {
            throw new Error(`${setting.key} debe ser un número`);
        }

        return String(numberValue);
    }

    return String(value ?? "").trim();
}

export function updateEditableSettings(input: Record<string, unknown>): void {
    let content = readEnvFile();

    for (const setting of editableSettings) {
        if (!(setting.key in input)) {
            continue;
        }

        const value = validateSettingValue(setting, input[setting.key]);
        const lineRegex = new RegExp(`^${setting.key}=.*$`, "m");

        if (lineRegex.test(content)) {
            content = content.replace(lineRegex, `${setting.key}=${value}`);
        } else {
            content += `\n${setting.key}=${value}`;
        }

        updateRuntimeSetting(setting.key, value);
    }

    fs.writeFileSync(ENV_PATH, content.trim() + "\n", "utf-8");

}