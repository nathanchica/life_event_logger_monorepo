import { z } from 'zod';

const envSchema = z.object({
    // Database connection string
    DATABASE_URL: z.string().url(),
    // Google OAuth Client ID
    GOOGLE_CLIENT_ID: z.string().min(1),
    // Client URL for the frontend application
    CLIENT_URL: z.string().url(),
    // Environment
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
});

export const env = envSchema.parse(process.env);
