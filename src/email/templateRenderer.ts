import fs from "fs";
import path from "path";

/**
 * Renderiza un template HTML reemplazando placeholders {{clave}}
 * @param templateName 
 * @param variables 
 * @returns 
 */
export function renderEmailTemplate(
    templateName: string,
    variables: Record<string, string | number>
): string {
    const templatePath = path.resolve(
        "src",
        "email",
        "templates",
        templateName
    );

    let html = fs.readFileSync(templatePath, "utf-8");

    for (const [key, value] of Object.entries(variables)) {
        html = html.replaceAll(`{{${key}}}`, String(value));
    }

    return html;
}