import type { Plugin } from 'graphql-yoga';

import { GraphQLContext } from '../context.js';

/**
 * Plugin to transfer headers from context.response to the actual HTTP response.
 * This works with the existing context structure where context.response.headers
 * is created in the createContext function.
 *
 * Uses a WeakMap to store the context by request during execution,
 * then applies the headers to the HTTP response.
 */
const contextByRequest = new WeakMap<Request, GraphQLContext>();

export const contextHeadersPlugin: Plugin = {
    onExecute({ args }) {
        // Store the context when GraphQL execution starts
        const request = args.contextValue?.request;
        if (request && args.contextValue) {
            contextByRequest.set(request, args.contextValue as GraphQLContext);
        }
    },
    onResponse({ request, response }) {
        // Retrieve the context and apply headers to the response
        const context = contextByRequest.get(request);

        if (context?.response?.headers) {
            // Transfer headers from context to actual HTTP response
            for (const [key, value] of context.response.headers.entries()) {
                response.headers.append(key, value);
            }
            contextByRequest.delete(request);
        }
    }
} as Plugin;
