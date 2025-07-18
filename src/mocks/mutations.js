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
}) => {
    return {
        request: {
            query,
            variables: { input }
        },
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
