import cron from "node-cron";

import { env } from "../config/env.js";
import { countSentEmailsToday } from "../db/repositories/emailLogRepository.js";
import { getMessageStatsForToday } from "../db/repositories/scheduledMessageRepository.js";
import { sendDailySummaryEmail } from "../email/mailer.js";
import { logInfo } from "../shared/logger.js";

export function startDailySummaryScheduler(): void {
    if (!env.DAILY_SUMMARY_ENABLED) {
        logInfo("Resumen diario por email desactivado");
        return;
    }

    const cronExpression = `${env.DAILY_SUMMARY_MINUTE} ${env.DAILY_SUMMARY_HOUR} * * *`;

    cron.schedule(cronExpression, () => {
        sendDailySummary();
    });

    logInfo(
        `Resumen diario programado a las ${env.DAILY_SUMMARY_HOUR}:${String(env.DAILY_SUMMARY_MINUTE).padStart(2, "0")}`
    );
}

function sendDailySummary(): void {
    const now = new Date();

    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const messageStats = getMessageStatsForToday(
        dayStart.toISOString(),
        dayEnd.toISOString()
    );

    const emailsSentToday = countSentEmailsToday(
        dayStart.toISOString(),
        dayEnd.toISOString()
    );

    const deliveryRate =
        messageStats.sentToday === 0
            ? 0
            : Math.round((messageStats.deliveredToday / messageStats.sentToday) * 100);

    sendDailySummaryEmail({
        ...messageStats,
        deliveryRate,
        emailsSentToday,
        date: now.toISOString().slice(0, 10),
    });

    logInfo("Resumen diario por email encolado");
}