import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import prismaMock from '../../../prisma/__mocks__/client.js';
import { cleanupExpiredTokens } from '../cleanup-tokens.js';

describe('cleanupExpiredTokens', () => {
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

    it('should delete expired refresh tokens older than 24 hours', async () => {
        const mockDeleteResult = { count: 5 };
        prismaMock.refreshToken.deleteMany.mockResolvedValue(mockDeleteResult);

        const result = await cleanupExpiredTokens();

        expect(result).toBe(5);

        expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledTimes(1);

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(
                /^\[CRON\] Deleted 5 expired refresh tokens older than \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
            )
        );
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return 0 when no tokens are deleted', async () => {
        const mockDeleteResult = { count: 0 };
        prismaMock.refreshToken.deleteMany.mockResolvedValue(mockDeleteResult);

        const result = await cleanupExpiredTokens();

        expect(result).toBe(0);
        expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledTimes(1);

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(
                /^\[CRON\] Deleted 0 expired refresh tokens older than \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
            )
        );

        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should throw error if deletion fails', async () => {
        const mockError = new Error('Database error');
        prismaMock.refreshToken.deleteMany.mockRejectedValue(mockError);

        await expect(cleanupExpiredTokens()).rejects.toThrow('Database error');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[CRON ERROR] Failed to cleanup tokens:', mockError);
        expect(consoleLogSpy).not.toHaveBeenCalled();
    });
});
