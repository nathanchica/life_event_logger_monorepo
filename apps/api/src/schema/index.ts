import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { DateTimeISOResolver } from 'graphql-scalars';

import eventLabelResolvers from './eventLabel/index.js';
import loggableEventResolvers from './loggableEvent/index.js';
import userResolvers from './user/index.js';

import { authDirectiveTransformer } from '../directives/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const typesArray = loadFilesSync(join(__dirname, '**/*.graphql'));

export const typeDefs = mergeTypeDefs(typesArray);
export const resolvers = mergeResolvers([
    {
        DateTime: DateTimeISOResolver
    },
    userResolvers,
    loggableEventResolvers,
    eventLabelResolvers
]);

let schema = makeExecutableSchema({
    typeDefs,
    resolvers
});

// Apply auth directives
schema = authDirectiveTransformer(schema);

export default schema;
