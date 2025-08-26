import type { MaintenanceResults } from '../daily-maintenance.js';
import { sendDiscordMessage } from '../utils/discord-webhook.js';

const MAX_ERRORS_TO_DISPLAY = 5;
const MAX_EVENTS_TO_DISPLAY = 15; // Discord embed field limit is 25, leave room for other fields

export async function sendDiscordSummary(results: MaintenanceResults): Promise<void> {
    // Determine color based on status
    let embedColor = 0x00ff00; // Green by default
    let title = '✅ Daily Maintenance Complete';

    if (results.errors.length > 0) {
        embedColor = 0xff0000; // Red if there were errors
        title = '❌ Daily Maintenance Complete (with errors)';
    } else if (results.alertsSent > 0) {
        embedColor = 0xffa500; // Orange if there were overdue events
        title = '⚠️ Daily Maintenance Complete';
    }

    const embed = {
        title,
        color: embedColor,
        fields: [
            {
                name: '🗑️ Tokens Cleaned',
                value: results.tokensDeleted.toString(),
                inline: true
            },
            {
                name: '📊 Events Checked',
                value: results.eventsChecked.toString(),
                inline: true
            },
            {
                name: '🔔 Overdue Events',
                value: results.alertsSent.toString(),
                inline: true
            }
        ],
        timestamp: new Date().toISOString()
    };

    // Add overdue events details if any
    if (results.overdueEvents && results.overdueEvents.length > 0) {
        // Add a separator field for better visual organization
        embed.fields.push({
            name: '\u200B', // Zero-width space for empty field
            value: '\u200B',
            inline: false
        });

        embed.fields.push({
            name: '⚠️ Overdue Events Details',
            value: '━━━━━━━━━━━━━━━━━━━━',
            inline: false
        });

        // Add each overdue event as a field
        const maxEvents = Math.min(results.overdueEvents.length, MAX_EVENTS_TO_DISPLAY);

        for (let i = 0; i < maxEvents; i++) {
            const event = results.overdueEvents[i];
            const overdueDays = event.daysSince - event.threshold;
            const labels = event.labels.length > 0 ? event.labels.join(', ') : 'No labels';

            embed.fields.push({
                name: `📌 ${event.name}`,
                value: `• Last logged: **${event.daysSince}** days ago\n• Threshold: **${event.threshold}** days\n• Overdue by: **${overdueDays}** days\n• Labels: ${labels}`,
                inline: false
            });
        }

        // If there are more events than we can display
        if (results.overdueEvents.length > maxEvents) {
            embed.fields.push({
                name: '➕ Additional Events',
                value: `... and ${results.overdueEvents.length - maxEvents} more overdue event(s)`,
                inline: false
            });
        }
    }

    // Add errors at the end if any
    if (results.errors.length > 0) {
        embed.fields.push({
            name: '❌ Errors',
            value: results.errors.slice(0, MAX_ERRORS_TO_DISPLAY).join('\n'),
            inline: false
        });

        if (results.errors.length > MAX_ERRORS_TO_DISPLAY) {
            embed.fields.push({
                name: '➕ Additional Errors',
                value: `... and ${results.errors.length - MAX_ERRORS_TO_DISPLAY} more error(s)`,
                inline: false
            });
        }
    }

    await sendDiscordMessage('📋 **Daily Maintenance Report**', [embed]);
}
