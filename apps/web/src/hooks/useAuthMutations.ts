import { useMutation, gql } from '@apollo/client';

// GraphQL Mutations
export const LOGIN_MUTATION = gql`
    mutation LoginMutation($input: GoogleOAuthLoginMutationInput!) {
        googleOAuthLoginMutation(input: $input) {
            accessToken
            user {
                id
                email
                name
            }
            errors {
                code
                field
                message
            }
        }
    }
`;

export const REFRESH_TOKEN_MUTATION = gql`
    mutation RefreshTokenMutation {
        refreshTokenMutation {
            accessToken
            errors {
                code
                message
            }
        }
    }
`;

export const LOGOUT_MUTATION = gql`
    mutation LogoutMutation {
        logoutMutation {
            success
            errors {
                code
                message
            }
        }
    }
`;

export const LOGOUT_ALL_DEVICES_MUTATION = gql`
    mutation LogoutAllDevicesMutation {
        logoutAllDevicesMutation {
            success
            errors {
                code
                message
            }
        }
    }
`;

/**
 * Hook for authentication mutations
 * Provides login, logout, refresh token, and logout all devices functionality
 */
export const useAuthMutations = () => {
    const [loginMutation, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_MUTATION);
    const [refreshTokenMutation, { loading: refreshLoading, error: refreshError }] =
        useMutation(REFRESH_TOKEN_MUTATION);
    const [logoutMutation, { loading: logoutLoading, error: logoutError }] = useMutation(LOGOUT_MUTATION);
    const [logoutAllDevicesMutation, { loading: logoutAllLoading, error: logoutAllError }] =
        useMutation(LOGOUT_ALL_DEVICES_MUTATION);

    return {
        // Mutations
        loginMutation,
        refreshTokenMutation,
        logoutMutation,
        logoutAllDevicesMutation,

        // Loading states
        loginLoading,
        refreshLoading,
        logoutLoading,
        logoutAllLoading,

        // Error states
        loginError,
        refreshError,
        logoutError,
        logoutAllError,

        // Composite loading state
        isLoading: loginLoading || refreshLoading || logoutLoading || logoutAllLoading
    };
};
