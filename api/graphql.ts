import { createYoga } from 'graphql-yoga';

import { env } from '../src/config/env.js';
import { createContext } from '../src/context.js';
import schema from '../src/schema/index.js';

const yoga = createYoga({
    schema,
    context: createContext,
    cors: {
        origin: env.CLIENT_URL.split(',').map((url) => url.trim()),
        credentials: true
    },
    graphiql: env.NODE_ENV === 'development'
});

export default yoga;
