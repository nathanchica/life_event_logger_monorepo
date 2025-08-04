import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createYoga } from 'graphql-yoga';

import { env } from '../src/config/env.js';
import { createContext } from '../src/context.js';
import schema from '../src/schema/index.js';
import { contextHeadersPlugin } from '../src/utils/plugins.js';

const yoga = createYoga({
    schema,
    context: createContext,
    cors: {
        origin: env.CLIENT_URL.split(',').map((url) => url.trim()),
        credentials: true
    },
    graphiql: env.NODE_ENV === 'development',
    logging: {
        debug: (...args) => console.debug(...args),
        info: (...args) => console.info(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args)
    },
    maskedErrors: {
        // Log full error details to console (will appear in Vercel logs)
        errorMessage: 'Unexpected error.',
        isDev: env.NODE_ENV === 'development' // Show full errors in development
    },
    plugins: [contextHeadersPlugin]
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    return yoga.handle(req, res);
}
