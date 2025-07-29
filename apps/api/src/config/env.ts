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
    // Refresh token expiration time in days
    REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().min(1).default(30)
});

export const env = envSchema.parse(process.env);
