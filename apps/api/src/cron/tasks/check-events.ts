import { processEventTimestamps } from '@life-event-logger/utils';
import type { LoggableEvent, User, EventLabel } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../prisma/client.js';

type LoggableEventWithRelations = LoggableEvent & {
    user: User;
    labels: EventLabel[];
};

export interface OverdueEvent {
    name: string;
    daysSince: number;
    threshold: number;
    labels: string[];
}

export interface EventCheckResult {
    checked: number;
    alerts: number;
    overdueEvents: OverdueEvent[];
}

export async function checkEventThresholds(): Promise<EventCheckResult> {
    const result: EventCheckResult = {
        checked: 0,
        alerts: 0,
        overdueEvents: []
    };

    try {
        if (!env.EVENT_ALERTS_USER_EMAIL) {
            console.log('[CRON] EVENT_ALERTS_USER_EMAIL not configured, skipping event checks');
            return result;
        }

        const user = await prisma.user.findUnique({
            where: { email: env.EVENT_ALERTS_USER_EMAIL }
        });

        if (!user) {
            console.log(`[CRON] User with email ${env.EVENT_ALERTS_USER_EMAIL} not found`);
            return result;
        }

        console.log(`[CRON] Checking events for user: ${user.name} (${user.email})`);

        const events: LoggableEventWithRelations[] = await prisma.loggableEvent.findMany({
            where: {
                userId: user.id,
                warningThresholdInDays: {
                    gt: 0 // Only check events that have a threshold set
                }
            },
            include: {
                user: true,
                labels: true
            }
        });

        result.checked = events.length;
        console.log(`[CRON] Checking ${events.length} events for threshold violations`);

        result.overdueEvents = events
            .map((event) => {
                const { daysSinceLastEvent } = processEventTimestamps(event.timestamps);

                if (daysSinceLastEvent === undefined) {
                    console.log(`[CRON] Event "${event.name}" has no timestamps, skipping`);
                    return null;
                }

                console.log(
                    `[CRON] Event "${event.name}": ${daysSinceLastEvent} days since last log (threshold: ${event.warningThresholdInDays})`
                );

                // Only include if overdue
                if (daysSinceLastEvent <= event.warningThresholdInDays) {
                    return null;
                }

                return {
                    name: event.name,
                    daysSince: daysSinceLastEvent,
                    threshold: event.warningThresholdInDays,
                    labels: event.labels.map((label) => label.name)
                };
            })
            .filter((event): event is OverdueEvent => event !== null);

        result.alerts = result.overdueEvents.length;

        // Log overdue events (alerts will be sent with summary)
        if (result.overdueEvents.length > 0) {
            console.log(`[CRON] Found ${result.overdueEvents.length} overdue events`);
        }

        return result;
    } catch (error) {
        console.error('[CRON ERROR] Failed to check event thresholds:', error);
        throw error;
    }
}
