import { MILLISECONDS_IN_DAY } from '../../auth/token.js';
import { prisma } from '../../prisma/client.js';

/**
 * Cleans up expired refresh tokens from the database.
 * @returns The number of deleted tokens.
 */
export async function cleanupExpiredTokens(): Promise<number> {
    try {
        // Delete tokens expired more than 24 hours ago
        const cutoffDate = new Date(Date.now() - MILLISECONDS_IN_DAY);

        const result = await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: cutoffDate
                }
            }
        });

        console.log(`[CRON] Deleted ${result.count} expired refresh tokens older than ${cutoffDate.toISOString()}`);
        return result.count;
    } catch (error) {
        console.error('[CRON ERROR] Failed to cleanup tokens:', error);
        throw error;
    }
}
