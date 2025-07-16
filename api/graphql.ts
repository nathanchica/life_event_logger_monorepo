import { createYoga } from 'graphql-yoga';

import { env } from '../src/config/env.js';
import { createContext } from '../src/context.js';
import schema from '../src/schema/index.js';

const yoga = createYoga({
    schema,
    context: createContext,
    cors: false,
    graphiql: env.NODE_ENV === 'development'
});

export default yoga;
