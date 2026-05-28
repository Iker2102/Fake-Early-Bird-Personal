function sanitize(value: unknown): string {
    const text = String(value);

    return text
        .replace(/\+?[0-9]{8,15}/g, "[PHONE]")
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [TOKEN]")
        .replace(/password["']?\s*[:=]\s*["'].*?["']/gi, 'password="[HIDDEN]"')
        .replace(/"message"\s*:\s*".*?"/gi, '"message":"[HIDDEN]"');
}

export function logInfo(message: string, ...args: unknown[]): void {
    console.log(
        `[INFO] ${sanitize(message)}`,
        ...args.map((arg) => sanitize(arg))
    );
}

export function logWarn(message: string, ...args: unknown[]): void {
    console.warn(
        `[WARN] ${sanitize(message)}`,
        ...args.map((arg) => sanitize(arg))
    );
}

export function logError(message: string, ...args: unknown[]): void {
    console.error(
        `[ERROR] ${sanitize(message)}`,
        ...args.map((arg) => sanitize(arg))
    );
}