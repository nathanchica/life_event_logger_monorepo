import { config } from 'dotenv';
import { z } from 'zod';

config({ path: '.env.local' });

const envSchema = z.object({
    // Database connection string
    DATABASE_URL: z.string().url(),
    // Google OAuth Client ID
    GOOGLE_CLIENT_ID: z.string().min(1),
    // Client URL for the frontend application (comma-separated for multiple origins)
    CLIENT_URL: z.string().min(1),
    // JWT secret for signing tokens
    JWT_SECRET: z.string().min(1),
    // Environment
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Access token expiration time in seconds
    ACCESS_TOKEN_EXPIRES_IN_SECONDS: z.coerce.number().min(1).default(900),
    // Refresh token expiration time in days (kept for backward compatibility)
    REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().min(1).default(30),
    // Sliding window duration - activity extends token by this many days
    REFRESH_TOKEN_SLIDING_DAYS: z.coerce.number().min(1).default(7),
    // Maximum session lifetime - tokens never exceed this
    REFRESH_TOKEN_ABSOLUTE_MAX_DAYS: z.coerce.number().min(1).default(30),
    // Discord webhook URL for cron job notifications
    DISCORD_WEBHOOK_URL: z.string().url().optional(),
    // Secret for authenticating cron job requests
    CRON_SECRET: z.string().min(1).optional(),
    // Email of user to check events for (for event threshold alerts)
    EVENT_ALERTS_USER_EMAIL: z.string().email().optional()
});

export const env = envSchema.parse(process.env);
