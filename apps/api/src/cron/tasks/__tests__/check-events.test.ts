import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { env } from '../../../config/env.js';
import prismaMock from '../../../prisma/__mocks__/client.js';
import { createMockLoggableEvent } from '../../../schema/loggableEvent/__mocks__/loggableEvent.js';
import { createMockUser } from '../../../schema/user/__mocks__/user.js';
import { checkEventThresholds } from '../check-events.js';

// Mock the env module
vi.mock('../../../config/env.js', () => ({
    env: {
        EVENT_ALERTS_USER_EMAIL: 'test@example.com',
        DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/test/test-webhook',
        CRON_SECRET: 'test-cron-secret',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        GOOGLE_CLIENT_ID: 'test-google-client-id',
        CLIENT_URL: 'http://localhost:3000',
        JWT_SECRET: 'test-jwt-secret',
        NODE_ENV: 'production',
        ACCESS_TOKEN_EXPIRES_IN_SECONDS: 900,
        REFRESH_TOKEN_EXPIRES_IN_DAYS: 30
    }
}));

describe('checkEventThresholds', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the env variable for each test
        env.EVENT_ALERTS_USER_EMAIL = 'test@example.com';
        // Setup console spies
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should skip checking when EVENT_ALERTS_USER_EMAIL is not configured', async () => {
        env.EVENT_ALERTS_USER_EMAIL = undefined;

        const result = await checkEventThresholds();

        expect(result).toEqual({
            checked: 0,
            alerts: 0,
            overdueEvents: []
        });
        expect(consoleLogSpy).toHaveBeenCalledWith(
            '[CRON] EVENT_ALERTS_USER_EMAIL not configured, skipping event checks'
        );
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return empty result when user is not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const result = await checkEventThresholds();

        expect(result).toEqual({
            checked: 0,
            alerts: 0,
            overdueEvents: []
        });
        expect(consoleLogSpy).toHaveBeenCalledWith('[CRON] User with email test@example.com not found');
        expect(prismaMock.loggableEvent.findMany).not.toHaveBeenCalled();
    });

    it('should check events and find no overdue events', async () => {
        const mockUser = createMockUser({
            name: 'Test User',
            email: 'test@example.com'
        });

        const mockEvents = [
            {
                ...createMockLoggableEvent({
                    name: 'Exercise',
                    userId: mockUser.id,
                    warningThresholdInDays: 7,
                    timestamps: [new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)] // 3 days ago
                }),
                user: mockUser,
                labels: []
            }
        ];

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.loggableEvent.findMany.mockResolvedValue(mockEvents);

        const result = await checkEventThresholds();

        expect(result).toEqual({
            checked: 1,
            alerts: 0,
            overdueEvents: []
        });
        // No Discord alerts sent directly from this function anymore
    });

    it('should detect overdue events and send alerts', async () => {
        const mockUser = createMockUser({
            name: 'Test User',
            email: 'test@example.com'
        });

        const mockEvents = [
            {
                ...createMockLoggableEvent({
                    name: 'Exercise',
                    userId: mockUser.id,
                    warningThresholdInDays: 7,
                    timestamps: [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)] // 10 days ago
                }),
                user: mockUser,
                labels: [{ id: 'label-1', name: 'Health' }]
            },
            {
                ...createMockLoggableEvent({
                    name: 'Check Plants',
                    userId: mockUser.id,
                    warningThresholdInDays: 3,
                    timestamps: [new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)] // 5 days ago
                }),
                user: mockUser,
                labels: []
            }
        ];

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.loggableEvent.findMany.mockResolvedValue(mockEvents);

        const result = await checkEventThresholds();

        expect(result.checked).toBe(2);
        expect(result.alerts).toBe(2);
        expect(result.overdueEvents).toHaveLength(2);
        expect(result.overdueEvents[0]).toEqual({
            name: 'Exercise',
            daysSince: 10,
            threshold: 7,
            labels: ['Health']
        });

        // Discord alert will be sent by sendDiscordSummary, not here
    });

    it('should skip events with no timestamps', async () => {
        const mockUser = createMockUser({
            name: 'Test User',
            email: 'test@example.com'
        });

        const mockEvents = [
            {
                ...createMockLoggableEvent({
                    name: 'New Event',
                    userId: mockUser.id,
                    warningThresholdInDays: 7,
                    timestamps: [] // No timestamps
                }),
                user: mockUser,
                labels: []
            }
        ];

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.loggableEvent.findMany.mockResolvedValue(mockEvents);

        const result = await checkEventThresholds();

        expect(result).toEqual({
            checked: 1,
            alerts: 0,
            overdueEvents: []
        });
        expect(consoleLogSpy).toHaveBeenCalledWith('[CRON] Event "New Event" has no timestamps, skipping');
    });

    it('should handle multiple timestamps and use the most recent', async () => {
        const mockUser = createMockUser({
            name: 'Test User',
            email: 'test@example.com'
        });

        const mockEvents = [
            {
                ...createMockLoggableEvent({
                    name: 'Exercise',
                    userId: mockUser.id,
                    warningThresholdInDays: 7,
                    timestamps: [
                        new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
                        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (most recent)
                        new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
                    ]
                }),
                user: mockUser,
                labels: []
            }
        ];

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.loggableEvent.findMany.mockResolvedValue(mockEvents);

        const result = await checkEventThresholds();

        expect(result.checked).toBe(1);
        expect(result.alerts).toBe(0); // 5 days < 7 days threshold
        expect(result.overdueEvents).toHaveLength(0);
    });

    it('should throw error when database fails', async () => {
        const mockError = new Error('Database error');
        prismaMock.user.findUnique.mockRejectedValue(mockError);

        await expect(checkEventThresholds()).rejects.toThrow('Database error');
    });

    it('should return all overdue events in the result', async () => {
        const mockUser = createMockUser({
            name: 'Test User',
            email: 'test@example.com'
        });

        // Create 15 overdue events
        const mockEvents = Array.from({ length: 15 }, (_, i) => ({
            ...createMockLoggableEvent({
                name: `Event ${i}`,
                userId: mockUser.id,
                warningThresholdInDays: 3,
                timestamps: [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)] // All 10 days ago
            }),
            user: mockUser,
            labels: []
        }));

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.loggableEvent.findMany.mockResolvedValue(mockEvents);

        const result = await checkEventThresholds();

        expect(result.alerts).toBe(15);
        expect(result.overdueEvents).toHaveLength(15);
        expect(result.overdueEvents[0].name).toBe('Event 0');
        expect(result.overdueEvents[14].name).toBe('Event 14');
        // All events should be in the overdueEvents array for sendDiscordSummary to handle
    });
});
