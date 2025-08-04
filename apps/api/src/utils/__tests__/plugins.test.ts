import { makeExecutableSchema } from '@graphql-tools/schema';
import { createYoga } from 'graphql-yoga';
import { describe, it, expect, vi } from 'vitest';

import { contextHeadersPlugin } from '../plugins.js';

describe('contextHeadersPlugin', () => {
    describe('header transfer functionality', () => {
        it('should transfer headers from context.response to HTTP response', async () => {
            // Create a test schema
            const schema = makeExecutableSchema({
                typeDefs: /* GraphQL */ `
                    type Query {
                        test: String
                    }
                `,
                resolvers: {
                    Query: {
                        test: (_, __, context) => {
                            // Set headers in context
                            context.response.headers.set('X-Test-Header', 'test-value');
                            context.response.headers.set('Set-Cookie', 'testCookie=value; HttpOnly');
                            return 'success';
                        }
                    }
                }
            });

            const yoga = createYoga({
                schema,
                context: ({ request }) => ({
                    request,
                    response: {
                        headers: new Headers()
                    }
                }),
                plugins: [contextHeadersPlugin]
            });

            // Execute a GraphQL request
            const response = await yoga.fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: '{ test }'
                })
            });

            // Verify headers were transferred
            expect(response.headers.get('X-Test-Header')).toBe('test-value');
            expect(response.headers.get('Set-Cookie')).toBe('testCookie=value; HttpOnly');
        });

        it('should handle multiple Set-Cookie headers correctly', async () => {
            const schema = makeExecutableSchema({
                typeDefs: /* GraphQL */ `
                    type Query {
                        test: String
                    }
                `,
                resolvers: {
                    Query: {
                        test: (_, __, context) => {
                            // Set multiple cookies
                            context.response.headers.append('Set-Cookie', 'cookie1=value1; HttpOnly');
                            context.response.headers.append('Set-Cookie', 'cookie2=value2; Secure');
                            return 'success';
                        }
                    }
                }
            });

            const yoga = createYoga({
                schema,
                context: ({ request }) => ({
                    request,
                    response: {
                        headers: new Headers()
                    }
                }),
                plugins: [contextHeadersPlugin]
            });

            const response = await yoga.fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: '{ test }'
                })
            });

            // Get all Set-Cookie headers
            const cookies = response.headers.getSetCookie();
            expect(cookies).toHaveLength(2);
            expect(cookies).toContain('cookie1=value1; HttpOnly');
            expect(cookies).toContain('cookie2=value2; Secure');
        });

        it('should not interfere with existing response headers', async () => {
            const schema = makeExecutableSchema({
                typeDefs: /* GraphQL */ `
                    type Query {
                        test: String
                    }
                `,
                resolvers: {
                    Query: {
                        test: (_, __, context) => {
                            context.response.headers.set('X-Custom-Header', 'custom-value');
                            return 'success';
                        }
                    }
                }
            });

            const yoga = createYoga({
                schema,
                context: ({ request }) => ({
                    request,
                    response: {
                        headers: new Headers()
                    }
                }),
                plugins: [
                    // Another plugin that sets headers
                    {
                        onResponse({ response }) {
                            response.headers.set('X-Plugin-Header', 'plugin-value');
                        }
                    },
                    contextHeadersPlugin
                ]
            });

            const response = await yoga.fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: '{ test }'
                })
            });

            // Both headers should be present
            expect(response.headers.get('X-Plugin-Header')).toBe('plugin-value');
            expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
        });
    });

    describe('edge cases', () => {
        it('should handle context without response object', async () => {
            const schema = makeExecutableSchema({
                typeDefs: /* GraphQL */ `
                    type Query {
                        test: String
                    }
                `,
                resolvers: {
                    Query: {
                        test: () => 'success'
                    }
                }
            });

            const yoga = createYoga({
                schema,
                // Context without response object
                context: ({ request }) => ({
                    request
                }),
                plugins: [contextHeadersPlugin]
            });

            const response = await yoga.fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: '{ test }'
                })
            });

            // Should not throw error
            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.data.test).toBe('success');
        });

        it('should handle context with empty headers', async () => {
            const schema = makeExecutableSchema({
                typeDefs: /* GraphQL */ `
                    type Query {
                        test: String
                    }
                `,
                resolvers: {
                    Query: {
                        test: () => 'success'
                    }
                }
            });

            const yoga = createYoga({
                schema,
                context: ({ request }) => ({
                    request,
                    response: {
                        headers: new Headers()
                    }
                }),
                plugins: [contextHeadersPlugin]
            });

            const response = await yoga.fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: '{ test }'
                })
            });

            // Should complete successfully without any custom headers
            expect(response.ok).toBe(true);
            expect(response.headers.get('X-Custom-Header')).toBeNull();
        });

        it('should handle context without request object', async () => {
            const schema = makeExecutableSchema({
                typeDefs: /* GraphQL */ `
                    type Query {
                        test: String
                    }
                `,
                resolvers: {
                    Query: {
                        test: () => 'success'
                    }
                }
            });

            const yoga = createYoga({
                schema,
                // Context without request
                context: () => ({
                    response: {
                        headers: new Headers()
                    }
                }),
                plugins: [contextHeadersPlugin]
            });

            const response = await yoga.fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: '{ test }'
                })
            });

            // Should not throw error
            expect(response.ok).toBe(true);
        });

        it('should clean up WeakMap entries after response', async () => {
            const contextByRequestSpy = vi.spyOn(WeakMap.prototype, 'delete');

            const schema = makeExecutableSchema({
                typeDefs: /* GraphQL */ `
                    type Query {
                        test: String
                    }
                `,
                resolvers: {
                    Query: {
                        test: (_, __, context) => {
                            context.response.headers.set('X-Test', 'value');
                            return 'success';
                        }
                    }
                }
            });

            const yoga = createYoga({
                schema,
                context: ({ request }) => ({
                    request,
                    response: {
                        headers: new Headers()
                    }
                }),
                plugins: [contextHeadersPlugin]
            });

            await yoga.fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: '{ test }'
                })
            });

            // Verify WeakMap cleanup was called
            expect(contextByRequestSpy).toHaveBeenCalled();
            contextByRequestSpy.mockRestore();
        });
    });

    describe('error handling', () => {
        it('should still transfer headers even if resolver throws error', async () => {
            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const schema = makeExecutableSchema({
                typeDefs: /* GraphQL */ `
                    type Query {
                        test: String
                    }
                `,
                resolvers: {
                    Query: {
                        test: (_, __, context) => {
                            context.response.headers.set('X-Error-Header', 'error-value');
                            throw new Error('Test error');
                        }
                    }
                }
            });

            const yoga = createYoga({
                schema,
                context: ({ request }) => ({
                    request,
                    response: {
                        headers: new Headers()
                    }
                }),
                plugins: [contextHeadersPlugin]
            });

            const response = await yoga.fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: '{ test }'
                })
            });

            // Headers should still be transferred even with error
            expect(response.headers.get('X-Error-Header')).toBe('error-value');

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });
    });
});
