import { GraphQLContext } from '../context.js';
import prismaMock from '../prisma/__mocks__/client.js';

export const createMockContext = (overrides?: Partial<GraphQLContext>): GraphQLContext => {
    // Create default mock request if not provided
    const defaultRequest = new Request('http://localhost:4000/graphql', {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json',
            'x-forwarded-for': '127.0.0.1',
            'user-agent': 'mock-user-agent'
        })
    });

    // Create default mock response if not provided
    const defaultResponse = {
        headers: new Headers()
    };

    return {
        prisma: prismaMock,
        user: null,
        request: defaultRequest,
        requestMetadata: {
            ipAddress: '127.0.0.1',
            userAgent: 'mock-user-agent'
        },
        response: defaultResponse,
        cookies: {},
        params: {},
        waitUntil: () => {},
        ...overrides
    };
};
