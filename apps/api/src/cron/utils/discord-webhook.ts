import { env } from '../../config/env.js';

export interface DiscordEmbed {
    title: string;
    description?: string;
    color?: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
    timestamp?: string;
}

export async function sendDiscordMessage(content: string, embeds?: DiscordEmbed[]): Promise<void> {
    if (!env.DISCORD_WEBHOOK_URL) {
        console.warn('[CRON] Discord webhook URL not configured');
        return;
    }

    try {
        const response = await fetch(env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Life Event Logger',
                content,
                embeds
            })
        });

        if (!response.ok) {
            throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
        }

        console.log('[CRON] Discord message sent successfully');
    } catch (error) {
        console.error('[CRON ERROR] Failed to send Discord message:', error);
        // Don't throw - we don't want Discord failures to break maintenance
    }
}
