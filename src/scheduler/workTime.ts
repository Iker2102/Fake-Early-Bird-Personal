import { env } from "../config/env.js";

/**
 * Devuelve la hora actual en el timezone configurado
 * @returns 
 */
export function getCurrentDateInTimezone(): Date {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: env.TZ,
        })
    );
}

/**
 * Comprueba si una fecha cae en fin de semana
 * @param date 
 * @returns 
 */
export function isWeekend(date: Date): boolean {
    const day = date.getDay();

    return day === 0 || day === 6;
}

/**
 * Comprueba si una fecha está dentro del horario laboral configurado
 * @param date 
 * @returns 
 */
export function isWithinWorkHours(date: Date): boolean {
    const hour = date.getHours();

    return hour >= env.WORK_HOURS_START && hour < env.WORK_HOURS_END;
}

/**
 * Comprueba si es festivo dentro de lo configurado
 * @param date 
 * @returns 
 */
export function isHoliday(date: Date): boolean {
    const dateKey = date.toISOString().slice(0, 10);

    return env.HOLIDAYS.includes(dateKey);
}