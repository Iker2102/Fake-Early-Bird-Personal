import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

export const env = {
    PORT: Number(process.env.PORT || 3000),

    DB_PATH: requireEnv("DB_PATH"),

    WA_SESSION_PATH: requireEnv("WA_SESSION_PATH"),
};
