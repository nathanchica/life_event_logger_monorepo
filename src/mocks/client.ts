import { createYoga } from 'graphql-yoga';

import { createMockContext } from './context.js';

import { GraphQLContext } from '../context.js';
import schema from '../schema/index.js';

export interface TestGraphQLClient {
    // This operation is used for any GraphQL query or mutation in tests so disable the no-explicit-any rule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: (operation: string, variables?: any, contextOverrides?: Partial<GraphQLContext>) => Promise<any>;
}

export const createTestClient = (): TestGraphQLClient => {
    const request = async (
        operation: string,
        // This operation is used for any GraphQL query or mutation in tests so disable the no-explicit-any rule
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        variables?: any,
        contextOverrides?: Partial<GraphQLContext>
    ) => {
        const yoga = createYoga({
            schema,
            context: () => createMockContext(contextOverrides)
        });

        const response = await yoga.fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: operation,
                variables
            })
        });

        const result = await response.json();

        return result;
    };

    return {
        request
    };
};
