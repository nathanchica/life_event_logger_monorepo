import { DateTimeISOResolver } from 'graphql-scalars';
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    schema: './src/schema/**/*.graphql',
    generates: {
        'src/generated/graphql.ts': {
            plugins: ['typescript', 'typescript-resolvers'],
            config: {
                useIndexSignature: true,
                contextType: '../context#GraphQLContext',
                mappers: {
                    User: '@prisma/client#User as PrismaUser',
                    LoggableEvent: '@prisma/client#LoggableEvent as PrismaLoggableEvent',
                    EventLabel: '@prisma/client#EventLabel as PrismaEventLabel'
                },
                scalars: {
                    DateTime: DateTimeISOResolver.extensions.codegenScalarType
                }
            }
        }
    }
};

export default config;
