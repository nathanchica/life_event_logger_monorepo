import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createYoga } from 'graphql-yoga';

import { env } from '../src/config/env.js';
import { createContext } from '../src/context.js';
import schema from '../src/schema/index.js';

const yoga = createYoga({
    schema,
    context: async (ctx) => {
        console.log('Creating GraphQL context...');
        const context = await createContext(ctx);
        console.log('Context created successfully');
        return context;
    },
    cors: {
        origin: env.CLIENT_URL.split(',').map((url) => url.trim()),
        credentials: true
    },
    graphiql: env.NODE_ENV === 'development',
    logging: {
        debug: (...args) => console.debug('Yoga Debug:', ...args),
        info: (...args) => console.info('Yoga Info:', ...args),
        warn: (...args) => console.warn('Yoga Warn:', ...args),
        error: (...args) => console.error('Yoga Error:', ...args)
    }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        console.log('GraphQL request received:', req.method, req.url);

        // Don't use $connect/$disconnect in serverless - let Prisma handle it
        const response = await yoga.handle(req, res);

        console.log('GraphQL request completed successfully');
        return response;
    } catch (error) {
        console.error('GraphQL handler error:', error);

        // Set CORS headers on error response
        const origin = req.headers.origin;
        const allowedOrigins = env.CLIENT_URL.split(',').map((url) => url.trim());

        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        return res.status(500).json({ error: 'Internal server error' });
    }
}
