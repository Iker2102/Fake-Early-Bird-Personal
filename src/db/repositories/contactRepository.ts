import { randomUUID } from "crypto";

import { database } from "../database.js";


/**
 * Representa un contacto almacenado en la base de datos
 */
export type Contact = {
    id: string;
    name: string;
    phone: string;
    tags: string | null;
    priority: string;
    lastInteraction: string | null;
};

/**
 * Datos necesarios para crear un contacto
 */
export type CreateContactInput = {
    name: string;
    phone: string;
    tags?: string | null;
    priority?: string;
};

/**
 * Crea un nuevo contacto
 * @param input 
 * @returns 
 */
export function createContact(input: CreateContactInput): Contact {
    const contact: Contact = {
        id: randomUUID(),
        name: input.name,
        phone: input.phone,
        tags: input.tags ?? null,
        priority: input.priority ?? "normal",
        lastInteraction: null,
    };

    database.prepare (
        `
        INSERT INTO contacts (
            id,
            name,
            phone,
            tags,
            priority,
            lastInteraction
        ) VALUES (
            @id,
            @name,
            @phone,
            @tags,
            @priority,
            @lastInteraction 
        )
        `
    ).run(contact);

    return contact
}

/**
 * Busca un contacto por ID
 * @param id
 * @returns 
 */
export function findContactById(id: string): Contact | null {
    const result = database.prepare(
        `
        SELECT * FROM contacts
        WHERE id = ?
        LIMIT 1
        `
    ).get(id) as Contact | undefined;

    return result ?? null;
}

/**
 * Busca un contacto por su teléfono
 * @param phone 
 * @returns 
 */
export function findContactByPhone(phone: string): Contact | null {
    const result = database.prepare(
        `
        SELECT * FROM contacts
        WHERE phone = ?
        LIMIT 1
        `
    ).get(phone) as Contact | undefined;

    return result ?? null;
}

/**
 * Actualiza la fecha de la última interacción
 * @param id 
 */
export function updateLastInteraction(id: string): void {
    database.prepare(
        `
        UPDATE contacts
        SET lastInteraction = ?
        WHER id = ?
        `
    ).run(new Date().toISOString(), id);
}

/**
 * Elimina un contacto
 * @param id 
 */
export function deleteContact(id: string): void {
    database.prepare(
        `
        DELETE FROM contacts
        WHERE id = ?
        `
    ).run(id);
}

/**
 * Devuelve todos los contactos
 * @returns 
 */
export function findContacts(): Contact[] {
    return database.prepare(
        `
        SELECT * FROM contacts
        ORDER BY name ASC
        `
    ).all() as Contact[];

}

/**
 * Busca contactos por nombre, teléfono o etiquetas
 * @param query 
 * @returns 
 */
export function searchContacts(query: string): Contact[] {
    return database
        .prepare(
            `
            SELECT *
            FROM contacts
            WHERE name LIKE ?
               OR phone LIKE ?
               OR tags LIKE ?
            ORDER BY name ASC
            `
        )
        .all(`%${query}%`, `%${query}%`, `%${query}%`) as Contact[];
}


/**
 * Actualiza parcialmente un contacto existente
 * Solo se modifican los campos enviados
 * @param id 
 * @param input 
 */
export function updateContact(
    id: string,
    input: Partial<CreateContactInput>
): void {
    database
        .prepare(
            `
            UPDATE contacts
            SET name = COALESCE(@name, name),
                phone = COALESCE(@phone, phone),
                tags = COALESCE(@tags, tags),
                priority = COALESCE(@priority, priority)
            WHERE id = @id
            `
        )
        .run({
            id,
            name: input.name ?? null,
            phone: input.phone ?? null,
            tags: input.tags ?? null,
            priority: input.priority ?? null,
        });
}