import { DocumentNode } from '@apollo/client';
import { GraphQLError } from 'graphql';

type CreateMutationResponseParams = {
    /** The GraphQL mutation document */
    query: DocumentNode;

    /** The input variables for the mutation. Omit for mutations without input */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input?: any;

    /** The name of the mutation field in the GraphQL response */
    mutationName: string;

    /** The payload data to return in the mutation response */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;

    /** API-level errors to include in the response (e.g., validation errors) */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiErrors?: any[];

    /** GraphQL-level error to simulate (e.g., network errors, auth errors) */
    gqlError?: GraphQLError | Error | null;

    /** Delay in milliseconds before returning the response */
    delay?: number;

    /** If true, returns null for the mutation payload to simulate empty response */
    nullPayload?: boolean;
};

/**
 * Creates a mock mutation response for Apollo Client testing
 */
export const createMutationResponse = ({
    query,
    input,
    mutationName,
    payload,
    apiErrors = [],
    gqlError = null,
    delay = 0,
    nullPayload = false
}: CreateMutationResponseParams) => {
    const request = {
        query,
        ...(input !== undefined ? { variables: { input } } : {})
    };

    return {
        request,
        ...(delay > 0 ? { delay } : {}),
        ...(gqlError
            ? {
                  error: gqlError
              }
            : {
                  result: {
                      data: {
                          [mutationName]: nullPayload
                              ? null
                              : {
                                    ...payload,
                                    errors: apiErrors
                                }
                      }
                  }
              })
    };
};
