import { describe, expect, it } from "vitest";

import {
    sanitizeText,
    validateMessage,
    validateOptionalText,
    validatePhone,
    validatePriority,
    validateRequiredText,
    validateScheduledAt,
    ValidationError,
} from "../../src/shared/validators.js";

describe("validators", () => {
    it("sanitiza texto quitando espacios", () => {
        expect(sanitizeText("  hola  ", "name")).toBe("hola");
    });

    it("rechaza valores que no son texto", () => {
        expect(() => sanitizeText(123, "name")).toThrow(ValidationError);
    });

    it("valida texto obligatorio", () => {
        expect(validateRequiredText(" Iker ", "name")).toBe("Iker");
    });

    it("rechaza texto obligatorio vacío", () => {
        expect(() => validateRequiredText("   ", "name")).toThrow(ValidationError);
    });

    it("valida texto opcional vacío como null", () => {
        expect(validateOptionalText("", "tags")).toBeNull();
    });

    it("valida teléfono correcto", () => {
        expect(validatePhone("+34 600 111 222")).toBe("+34600111222");
    });

    it("rechaza teléfono inválido", () => {
        expect(() => validatePhone("abc")).toThrow(ValidationError);
    });

    it("valida mensaje correcto", () => {
        expect(validateMessage("Hola")).toBe("Hola");
    });

    it("rechaza mensaje vacío", () => {
        expect(() => validateMessage("   ")).toThrow(ValidationError);
    });

    it("valida fecha programada", () => {
        expect(validateScheduledAt("2026-05-20T06:35:00.000Z")).toBe(
            "2026-05-20T06:35:00.000Z"
        );
    });

    it("rechaza fecha inválida", () => {
        expect(() => validateScheduledAt("fecha mala")).toThrow(ValidationError);
    });

    it("valida prioridad normal", () => {
        expect(validatePriority("normal")).toBe("normal");
    });

    it("valida prioridad favorito", () => {
        expect(validatePriority("favorite")).toBe("favorite");
    });

    it("rechaza prioridad inválida", () => {
        expect(() => validatePriority("admin")).toThrow(ValidationError);
    });
});