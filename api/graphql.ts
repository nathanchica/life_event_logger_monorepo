import { createYoga } from 'graphql-yoga';

import { env } from '../src/config/env';
import { createContext } from '../src/context';
import schema from '../src/schema';

const yoga = createYoga({
    schema,
    context: createContext,
    cors: {
        origin: env.CLIENT_URL,
        credentials: true
    },
    graphiql: env.NODE_ENV === 'development'
});

export default yoga;
