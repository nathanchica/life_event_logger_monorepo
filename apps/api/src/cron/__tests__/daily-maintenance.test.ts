import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { runDailyMaintenance } from '../daily-maintenance.js';
import * as checkEvents from '../tasks/check-events.js';
import * as cleanupTokens from '../tasks/cleanup-tokens.js';
import * as sendDiscord from '../tasks/send-discord.js';

// Mock the task modules
vi.mock('../tasks/cleanup-tokens.js', () => ({
    cleanupExpiredTokens: vi.fn()
}));

vi.mock('../tasks/check-events.js', () => ({
    checkEventThresholds: vi.fn()
}));

vi.mock('../tasks/send-discord.js', () => ({
    sendDiscordSummary: vi.fn()
}));

describe('runDailyMaintenance', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should run all maintenance tasks successfully', async () => {
        vi.mocked(cleanupTokens.cleanupExpiredTokens).mockResolvedValue(5);
        vi.mocked(checkEvents.checkEventThresholds).mockResolvedValue({
            checked: 10,
            alerts: 2,
            overdueEvents: [
                {
                    name: 'Exercise',
                    daysSince: 10,
                    threshold: 7,
                    labels: ['Health']
                }
            ]
        });
        vi.mocked(sendDiscord.sendDiscordSummary).mockResolvedValue(undefined);

        const results = await runDailyMaintenance();

        expect(results).toEqual({
            tokensDeleted: 5,
            eventsChecked: 10,
            alertsSent: 2,
            overdueEvents: [
                {
                    name: 'Exercise',
                    daysSince: 10,
                    threshold: 7,
                    labels: ['Health']
                }
            ],
            errors: []
        });

        // Verify all tasks were called
        expect(cleanupTokens.cleanupExpiredTokens).toHaveBeenCalledTimes(1);
        expect(checkEvents.checkEventThresholds).toHaveBeenCalledTimes(1);
        expect(sendDiscord.sendDiscordSummary).toHaveBeenCalledTimes(1);
        expect(sendDiscord.sendDiscordSummary).toHaveBeenCalledWith(results);

        // Verify logging - should have 3 log calls
        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Starting daily maintenance\.\.\./)
        );
        expect(consoleLogSpy).toHaveBeenCalledWith('[CRON] Deleted 5 expired refresh tokens');
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Daily maintenance completed/)
        );

        // Verify no errors were logged
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle errors in token cleanup gracefully', async () => {
        const cleanupError = new Error('Database connection failed');
        vi.mocked(cleanupTokens.cleanupExpiredTokens).mockRejectedValue(cleanupError);
        vi.mocked(checkEvents.checkEventThresholds).mockResolvedValue({
            checked: 0,
            alerts: 0,
            overdueEvents: []
        });
        vi.mocked(sendDiscord.sendDiscordSummary).mockResolvedValue(undefined);

        const results = await runDailyMaintenance();

        expect(results.errors).toContain('Database connection failed');
        expect(results.tokensDeleted).toBe(0);

        // Other tasks should not run after error
        expect(checkEvents.checkEventThresholds).not.toHaveBeenCalled();
        expect(sendDiscord.sendDiscordSummary).not.toHaveBeenCalled();

        // Verify console messages
        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Starting daily maintenance\.\.\./)
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Daily maintenance completed/)
        );

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[CRON ERROR] Maintenance error:', cleanupError);
    });

    it('should handle errors in event checking gracefully', async () => {
        vi.mocked(cleanupTokens.cleanupExpiredTokens).mockResolvedValue(3);
        const eventError = new Error('Event check failed');
        vi.mocked(checkEvents.checkEventThresholds).mockRejectedValue(eventError);
        vi.mocked(sendDiscord.sendDiscordSummary).mockResolvedValue(undefined);

        const results = await runDailyMaintenance();

        expect(results.errors).toContain('Event check failed');
        expect(results.tokensDeleted).toBe(3);
        expect(results.eventsChecked).toBe(0);

        // Discord summary should not be called after error
        expect(sendDiscord.sendDiscordSummary).not.toHaveBeenCalled();

        // Verify console messages
        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Starting daily maintenance\.\.\./)
        );
        expect(consoleLogSpy).toHaveBeenCalledWith('[CRON] Deleted 3 expired refresh tokens');
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Daily maintenance completed/)
        );

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[CRON ERROR] Maintenance error:', eventError);
    });

    it('should continue even if Discord summary fails', async () => {
        vi.mocked(cleanupTokens.cleanupExpiredTokens).mockResolvedValue(2);
        vi.mocked(checkEvents.checkEventThresholds).mockResolvedValue({
            checked: 5,
            alerts: 1,
            overdueEvents: []
        });
        const discordError = new Error('Discord webhook failed');
        vi.mocked(sendDiscord.sendDiscordSummary).mockRejectedValue(discordError);

        const results = await runDailyMaintenance();

        expect(results.errors).toContain('Discord webhook failed');
        expect(results.tokensDeleted).toBe(2);
        expect(results.eventsChecked).toBe(5);
        expect(results.alertsSent).toBe(1);

        // Verify console messages
        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Starting daily maintenance\.\.\./)
        );
        expect(consoleLogSpy).toHaveBeenCalledWith('[CRON] Deleted 2 expired refresh tokens');
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Daily maintenance completed/)
        );

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[CRON ERROR] Maintenance error:', discordError);
    });

    it('should handle non-Error objects in catch block', async () => {
        // Simulate a non-Error being thrown
        vi.mocked(cleanupTokens.cleanupExpiredTokens).mockRejectedValue('String error');
        vi.mocked(checkEvents.checkEventThresholds).mockResolvedValue({
            checked: 0,
            alerts: 0,
            overdueEvents: []
        });

        const results = await runDailyMaintenance();

        expect(results.errors).toContain('Unknown error');

        // Verify console messages
        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Starting daily maintenance\.\.\./)
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Daily maintenance completed/)
        );

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[CRON ERROR] Maintenance error:', 'String error');
    });

    it('should return correct structure when no events are overdue', async () => {
        vi.mocked(cleanupTokens.cleanupExpiredTokens).mockResolvedValue(0);
        vi.mocked(checkEvents.checkEventThresholds).mockResolvedValue({
            checked: 3,
            alerts: 0,
            overdueEvents: []
        });
        vi.mocked(sendDiscord.sendDiscordSummary).mockResolvedValue(undefined);

        const results = await runDailyMaintenance();

        expect(results).toEqual({
            tokensDeleted: 0,
            eventsChecked: 3,
            alertsSent: 0,
            overdueEvents: [],
            errors: []
        });

        // Verify console messages
        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Starting daily maintenance\.\.\./)
        );
        expect(consoleLogSpy).toHaveBeenCalledWith('[CRON] Deleted 0 expired refresh tokens');
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Daily maintenance completed/)
        );

        // Verify no errors were logged
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
});
