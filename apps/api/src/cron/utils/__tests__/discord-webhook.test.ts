import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';

import { env } from '../../../config/env.js';
import { sendDiscordMessage } from '../discord-webhook.js';

// Mock the env module
vi.mock('../../../config/env.js', () => ({
    env: {
        DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/test/test-webhook'
    }
}));

describe('sendDiscordMessage', () => {
    let originalFetch: typeof global.fetch;
    let mockFetch: ReturnType<typeof vi.fn>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeAll(() => {
        originalFetch = global.fetch;
        mockFetch = vi.fn();
        global.fetch = mockFetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test/test-webhook';

        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should send a message successfully', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK'
        });

        await sendDiscordMessage('Test message');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith('https://discord.com/api/webhooks/test/test-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Life Event Logger',
                content: 'Test message',
                embeds: undefined
            })
        });

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith('[CRON] Discord message sent successfully');
        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should send a message with embeds', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK'
        });

        const embeds = [
            {
                title: 'Test Embed',
                description: 'Test Description',
                color: 0x00ff00,
                fields: [{ name: 'Field 1', value: 'Value 1', inline: true }],
                timestamp: '2024-01-01T00:00:00.000Z'
            }
        ];

        await sendDiscordMessage('Test message with embeds', embeds);

        expect(mockFetch).toHaveBeenCalledWith('https://discord.com/api/webhooks/test/test-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Life Event Logger',
                content: 'Test message with embeds',
                embeds
            })
        });

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith('[CRON] Discord message sent successfully');
        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should skip sending when DISCORD_WEBHOOK_URL is not configured', async () => {
        env.DISCORD_WEBHOOK_URL = undefined;

        await sendDiscordMessage('Test message');

        expect(mockFetch).not.toHaveBeenCalled();

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledWith('[CRON] Discord webhook URL not configured');
        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle webhook failures without throwing', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 400,
            statusText: 'Bad Request'
        });

        await expect(sendDiscordMessage('Test message')).resolves.toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[CRON ERROR] Failed to send Discord message:', expect.any(Error));
        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle network errors without throwing', async () => {
        const networkError = new Error('Network error');
        mockFetch.mockRejectedValue(networkError);

        await expect(sendDiscordMessage('Test message')).resolves.toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[CRON ERROR] Failed to send Discord message:', networkError);
        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should log appropriate error message for non-ok responses', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests'
        });

        await sendDiscordMessage('Test message');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[CRON ERROR] Failed to send Discord message:',
            expect.objectContaining({
                message: 'Discord webhook failed: 429 Too Many Requests'
            })
        );
        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
});
