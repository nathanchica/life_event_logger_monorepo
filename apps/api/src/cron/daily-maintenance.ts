import { checkEventThresholds, type EventCheckResult } from './tasks/check-events.js';
import { cleanupExpiredTokens } from './tasks/cleanup-tokens.js';
import { sendDiscordSummary } from './tasks/send-discord.js';

export interface MaintenanceResults {
    tokensDeleted: number;
    eventsChecked: number;
    alertsSent: number;
    overdueEvents: EventCheckResult['overdueEvents'];
    errors: string[];
}

export async function runDailyMaintenance(): Promise<MaintenanceResults> {
    const results: MaintenanceResults = {
        tokensDeleted: 0,
        eventsChecked: 0,
        alertsSent: 0,
        overdueEvents: [],
        errors: []
    };

    console.log(`[${new Date().toISOString()}] Starting daily maintenance...`);

    try {
        // Task 1: Clean up expired refresh tokens
        results.tokensDeleted = await cleanupExpiredTokens();
        console.log(`[CRON] Deleted ${results.tokensDeleted} expired refresh tokens`);

        // Task 2: Check event thresholds
        const eventResults = await checkEventThresholds();
        results.eventsChecked = eventResults.checked;
        results.alertsSent = eventResults.alerts;
        results.overdueEvents = eventResults.overdueEvents;

        // Task 3: Send summary to Discord
        await sendDiscordSummary(results);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(errorMessage);
        console.error('[CRON ERROR] Maintenance error:', error);
    }

    console.log(`[${new Date().toISOString()}] Daily maintenance completed`);
    return results;
}
