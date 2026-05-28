export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export function sanitizeText(value: unknown, fieldName: string): string {
    if (typeof value !== "string") {
        throw new ValidationError(`${fieldName} debe ser texto`);
    }

    return value.trim();
}

export function validateRequiredText(
    value: unknown,
    fieldName: string,
    maxLength = 500
): string {
    const text = sanitizeText(value, fieldName);

    if (!text) {
        throw new ValidationError(`${fieldName} es obligatorio`);
    }

    if (text.length > maxLength) {
        throw new ValidationError(`${fieldName} no puede superar ${maxLength} caracteres`);
    }

    return text;
}

export function validateOptionalText(
    value: unknown,
    fieldName: string,
    maxLength = 500
): string | null {
    if (value === undefined || value === null) {
        return null;
    }

    const text = sanitizeText(value, fieldName);

    if (!text) {
        return null;
    }

    if (text.length > maxLength) {
        throw new ValidationError(`${fieldName} no puede superar ${maxLength} caracteres`);
    }

    return text;
}

export function validatePhone(value: unknown): string {
    const phone = validateRequiredText(value, "phone", 20);

    const normalized = phone.replace(/\s/g, "");

    const phoneRegex = /^\+?[0-9]{8,15}$/;

    if (!phoneRegex.test(normalized)) {
        throw new ValidationError("El teléfono no tiene un formato válido");
    }

    return normalized;
}

export function validateMessage(value: unknown): string {
    return validateRequiredText(value, "message", 2000);
}

export function validateScheduledAt(value: unknown): string {
    const scheduledAt = validateRequiredText(value, "scheduledAt", 40);

    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime())) {
        throw new ValidationError("scheduledAt debe ser una fecha válida");
    }

    return date.toISOString();
}

export function validatePriority(value: unknown): "normal" | "favorite" {
    if (value === undefined || value === null || value === "") {
        return "normal";
    }

    const priority = sanitizeText(value, "priority");

    if (priority !== "normal" && priority !== "favorite") {
        throw new ValidationError("priority debe ser normal o favorite");
    }

    return priority;
}