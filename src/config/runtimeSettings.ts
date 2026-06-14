import { env } from "./env.js";

export const runtimeSettings = {
    WORK_HOURS_START: env.WORK_HOURS_START,
    WORK_HOURS_END: env.WORK_HOURS_END,

    CONTACT_COOLDOWN_MINUTES: env.CONTACT_COOLDOWN_MINUTES,
    MAX_MESSAGES_PER_CONTACT_PER_DAY: env.MAX_MESSAGES_PER_CONTACT_PER_DAY,
    SCHEDULE_VARIATION_MINUTES: env.SCHEDULE_VARIATION_MINUTES,

    NOTIFY_ON_SUCCESS: env.NOTIFY_ON_SUCCESS,
    NOTIFY_ON_DISCONNECT: env.NOTIFY_ON_DISCONNECT,

    LOG_LEVEL: env.LOG_LEVEL,
};

export function updateRuntimeSetting(key: string, value: string): void {
    if (!(key in runtimeSettings)) {
        return;
    }

    const currentValue = runtimeSettings[key as keyof typeof runtimeSettings];

    if (typeof currentValue === "number") {
        runtimeSettings[key as keyof typeof runtimeSettings] = Number(value) as never;
        return;
    }

    if (typeof currentValue === "boolean") {
        runtimeSettings[key as keyof typeof runtimeSettings] = (value === "true") as never;
        return;
    }

    runtimeSettings[key as keyof typeof runtimeSettings] = value as never;
}