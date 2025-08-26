import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';

import type { MaintenanceResults } from '../../daily-maintenance.js';
import * as discordWebhook from '../../utils/discord-webhook.js';
import type { DiscordEmbed } from '../../utils/discord-webhook.js';
import { sendDiscordSummary } from '../send-discord.js';

// Mock the discord webhook module
vi.mock('../../utils/discord-webhook.js', () => ({
    sendDiscordMessage: vi.fn()
}));

describe('sendDiscordSummary', () => {
    let mockedSendDiscordMessage: MockedFunction<typeof discordWebhook.sendDiscordMessage>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockedSendDiscordMessage = vi.mocked(discordWebhook.sendDiscordMessage) as MockedFunction<
            typeof discordWebhook.sendDiscordMessage
        >;
    });

    it('should send a summary with successful results (green)', async () => {
        const results: MaintenanceResults = {
            tokensDeleted: 5,
            eventsChecked: 10,
            alertsSent: 0,
            overdueEvents: [],
            errors: []
        };

        await sendDiscordSummary(results);

        expect(discordWebhook.sendDiscordMessage).toHaveBeenCalledTimes(1);
        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const [message, embeds] = calls[0];

        expect(message).toBe('📋 **Daily Maintenance Report**');
        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        expect(embed).toMatchObject({
            title: '✅ Daily Maintenance Complete',
            color: 0x00ff00, // Green
            fields: expect.arrayContaining([
                { name: '🗑️ Tokens Cleaned', value: '5', inline: true },
                { name: '📊 Events Checked', value: '10', inline: true },
                { name: '🔔 Overdue Events', value: '0', inline: true }
            ])
        });
        expect(embed.timestamp).toBeDefined();
    });

    it('should send a summary with overdue events (orange)', async () => {
        const results: MaintenanceResults = {
            tokensDeleted: 3,
            eventsChecked: 8,
            alertsSent: 2,
            overdueEvents: [
                {
                    name: 'Exercise',
                    daysSince: 10,
                    threshold: 7,
                    labels: ['Health']
                },
                {
                    name: 'Check Plants',
                    daysSince: 5,
                    threshold: 3,
                    labels: []
                }
            ],
            errors: []
        };

        await sendDiscordSummary(results);

        expect(discordWebhook.sendDiscordMessage).toHaveBeenCalledTimes(1);
        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const embeds = calls[0][1];

        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        expect(embed).toMatchObject({
            title: '⚠️ Daily Maintenance Complete',
            color: 0xffa500, // Orange for overdue events
            fields: expect.arrayContaining([
                { name: '🗑️ Tokens Cleaned', value: '3', inline: true },
                { name: '📊 Events Checked', value: '8', inline: true },
                { name: '🔔 Overdue Events', value: '2', inline: true },
                { name: '\u200B', value: '\u200B', inline: false }, // Separator
                {
                    name: '⚠️ Overdue Events Details',
                    value: '━━━━━━━━━━━━━━━━━━━━',
                    inline: false
                },
                {
                    name: '📌 Exercise',
                    value: '• Last logged: **10** days ago\n• Threshold: **7** days\n• Overdue by: **3** days\n• Labels: Health',
                    inline: false
                },
                {
                    name: '📌 Check Plants',
                    value: '• Last logged: **5** days ago\n• Threshold: **3** days\n• Overdue by: **2** days\n• Labels: No labels',
                    inline: false
                }
            ])
        });
    });

    it('should send a summary with errors (red)', async () => {
        const results: MaintenanceResults = {
            tokensDeleted: 0,
            eventsChecked: 0,
            alertsSent: 0,
            overdueEvents: [],
            errors: ['Database connection failed', 'Discord webhook error']
        };

        await sendDiscordSummary(results);

        expect(discordWebhook.sendDiscordMessage).toHaveBeenCalledTimes(1);
        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const embeds = calls[0][1];

        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        expect(embed).toMatchObject({
            title: '❌ Daily Maintenance Complete (with errors)',
            color: 0xff0000, // Red for errors
            fields: expect.arrayContaining([
                { name: '🗑️ Tokens Cleaned', value: '0', inline: true },
                { name: '📊 Events Checked', value: '0', inline: true },
                { name: '🔔 Overdue Events', value: '0', inline: true },
                {
                    name: '❌ Errors',
                    value: 'Database connection failed\nDiscord webhook error',
                    inline: false
                }
            ])
        });
    });

    it('should send a summary with both errors and overdue events (red takes priority)', async () => {
        const results: MaintenanceResults = {
            tokensDeleted: 2,
            eventsChecked: 5,
            alertsSent: 1,
            overdueEvents: [
                {
                    name: 'Check Plants',
                    daysSince: 5,
                    threshold: 3,
                    labels: []
                }
            ],
            errors: ['Minor error occurred']
        };

        await sendDiscordSummary(results);

        expect(discordWebhook.sendDiscordMessage).toHaveBeenCalledTimes(1);
        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const embeds = calls[0][1];

        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        expect(embed).toMatchObject({
            title: '❌ Daily Maintenance Complete (with errors)',
            color: 0xff0000, // Red takes priority over orange
            fields: expect.arrayContaining([
                { name: '🗑️ Tokens Cleaned', value: '2', inline: true },
                { name: '📊 Events Checked', value: '5', inline: true },
                { name: '🔔 Overdue Events', value: '1', inline: true },
                {
                    name: '❌ Errors',
                    value: 'Minor error occurred',
                    inline: false
                }
            ])
        });

        // Should also have the overdue event
        const fields = embed.fields;
        expect(fields).toBeDefined();
        const eventField = fields?.find((f) => f.name === '📌 Check Plants');
        expect(eventField).toBeDefined();
    });

    it('should limit errors to 5 when there are many', async () => {
        const results: MaintenanceResults = {
            tokensDeleted: 0,
            eventsChecked: 0,
            alertsSent: 0,
            overdueEvents: [],
            errors: ['Error 1', 'Error 2', 'Error 3', 'Error 4', 'Error 5', 'Error 6', 'Error 7']
        };

        await sendDiscordSummary(results);

        expect(discordWebhook.sendDiscordMessage).toHaveBeenCalledTimes(1);
        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const embeds = calls[0][1];

        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        const fields = embed.fields;
        expect(fields).toBeDefined();

        const errorField = fields?.find((f) => f.name === '❌ Errors');
        expect(errorField).toBeDefined();
        expect(errorField?.value).toBe('Error 1\nError 2\nError 3\nError 4\nError 5');

        const additionalErrorsField = fields?.find((f) => f.name === '➕ Additional Errors');
        expect(additionalErrorsField).toBeDefined();
        expect(additionalErrorsField?.value).toBe('... and 2 more error(s)');
    });

    it('should limit overdue events to 15 when there are many', async () => {
        // Create 20 overdue events
        const overdueEvents = Array.from({ length: 20 }, (_, i) => ({
            name: `Event ${i}`,
            daysSince: 10,
            threshold: 7,
            labels: []
        }));

        const results: MaintenanceResults = {
            tokensDeleted: 5,
            eventsChecked: 20,
            alertsSent: 20,
            overdueEvents,
            errors: []
        };

        await sendDiscordSummary(results);

        expect(discordWebhook.sendDiscordMessage).toHaveBeenCalledTimes(1);
        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const embeds = calls[0][1];

        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        const fields = embed.fields;
        expect(fields).toBeDefined();

        // Count event fields
        const eventFields = fields?.filter((f) => f.name.startsWith('📌')) ?? [];
        expect(eventFields).toHaveLength(15);

        // Should have additional events field
        const additionalField = fields?.find((f) => f.name === '➕ Additional Events');
        expect(additionalField).toBeDefined();
        expect(additionalField?.value).toBe('... and 5 more overdue event(s)');
    });

    it('should handle empty results gracefully', async () => {
        const results: MaintenanceResults = {
            tokensDeleted: 0,
            eventsChecked: 0,
            alertsSent: 0,
            overdueEvents: [],
            errors: []
        };

        await sendDiscordSummary(results);

        expect(discordWebhook.sendDiscordMessage).toHaveBeenCalledTimes(1);
        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const embeds = calls[0][1];

        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        expect(embed).toMatchObject({
            title: '✅ Daily Maintenance Complete',
            color: 0x00ff00, // Green (no errors or alerts)
            fields: [
                { name: '🗑️ Tokens Cleaned', value: '0', inline: true },
                { name: '📊 Events Checked', value: '0', inline: true },
                { name: '🔔 Overdue Events', value: '0', inline: true }
            ]
        });
        // Should not have error or overdue event fields
        expect(embed.fields).toHaveLength(3);
    });

    it('should include timestamp in ISO format', async () => {
        const results: MaintenanceResults = {
            tokensDeleted: 1,
            eventsChecked: 1,
            alertsSent: 0,
            overdueEvents: [],
            errors: []
        };

        await sendDiscordSummary(results);

        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const embeds = calls[0][1];

        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        expect(embed.timestamp).toBeDefined();
        expect(embed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle overdue events with multiple labels', async () => {
        const results: MaintenanceResults = {
            tokensDeleted: 1,
            eventsChecked: 1,
            alertsSent: 1,
            overdueEvents: [
                {
                    name: 'Complex Task',
                    daysSince: 14,
                    threshold: 7,
                    labels: ['Work', 'Important', 'Weekly']
                }
            ],
            errors: []
        };

        await sendDiscordSummary(results);

        const calls = mockedSendDiscordMessage.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const embeds = calls[0][1];

        expect(embeds).toBeDefined();
        expect(embeds).toHaveLength(1);

        const embed = embeds?.[0] as DiscordEmbed;
        const fields = embed.fields;
        expect(fields).toBeDefined();

        const eventField = fields?.find((f) => f.name === '📌 Complex Task');
        expect(eventField).toBeDefined();
        expect(eventField?.value).toContain('• Labels: Work, Important, Weekly');
    });
});
