import type { VercelRequest, VercelResponse } from '@vercel/node';

import { env } from '../../src/config/env.js';
import { runDailyMaintenance } from '../../src/cron/daily-maintenance.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!env.CRON_SECRET) {
        console.error('[CRON] CRON_SECRET not configured');
        return res.status(500).json({ error: 'Cron job not configured properly' });
    }

    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const results = await runDailyMaintenance();
        return res.status(200).json({
            success: true,
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cron job failed:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export const config = {
    maxDuration: 60
};
