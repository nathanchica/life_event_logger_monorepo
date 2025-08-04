import { createServer } from 'http';

import { createYoga } from 'graphql-yoga';

import { env } from './config/env.js';
import { createContext } from './context.js';
import schema from './schema/index.js';
import { contextHeadersPlugin } from './utils/plugins.js';

const yoga = createYoga({
    schema,
    context: createContext,
    cors: {
        origin: env.CLIENT_URL,
        credentials: true
    },
    graphiql: env.NODE_ENV === 'development',
    plugins: [contextHeadersPlugin]
});

const server = createServer(yoga);

server.listen(4000, () => {
    console.info(`Server running on http://localhost:4000/graphql`);
});

export default server;
