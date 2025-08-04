// Token expiration constants
const DEFAULT_TOKEN_EXPIRY_SECONDS = 900; // 15 minutes
const TOKEN_EXPIRY_BUFFER_SECONDS = 30; // 30 second buffer before actual expiry
const MILLISECONDS_PER_SECOND = 1000;

// GraphQL mutation as a string constant
const REFRESH_TOKEN_MUTATION = `
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

/**
 * Token storage service for managing JWT access tokens.
 *
 * Features:
 * - Stores access tokens in memory only (for security)
 * - Automatic expiration checking with configurable buffer
 * - Proactive token refresh using native fetch API
 * - Handles concurrent refresh requests to prevent race conditions
 *
 * This service is accessible by both React components and non-React code (like Apollo links),
 * avoiding circular dependencies that would occur if using Apollo Client for refresh.
 */
class TokenStorage {
    private accessToken: string | null = null;
    private tokenExpiresAt: number | null = null;
    private refreshPromise: Promise<string | null> | null = null;

    /**
     * Check if the current token is expired
     * @returns true if token is expired or not set
     */
    private isTokenExpired(): boolean {
        if (!this.accessToken || !this.tokenExpiresAt) {
            return true;
        }
        return Date.now() > this.tokenExpiresAt;
    }

    /**
     * Store an access token with its expiration time
     * @param token - The access token to store
     * @param expiresInSeconds - Token lifetime in seconds (default: 900)
     */
    setAccessToken(token: string, expiresInSeconds: number = DEFAULT_TOKEN_EXPIRY_SECONDS) {
        this.accessToken = token;
        // Calculate expiration time with buffer for safety
        const expiryWithBuffer = expiresInSeconds - TOKEN_EXPIRY_BUFFER_SECONDS;
        this.tokenExpiresAt = Date.now() + expiryWithBuffer * MILLISECONDS_PER_SECOND;
    }

    /**
     * Get the current access token if it's still valid (synchronous check).
     * Use this when you need to check token state without triggering a refresh.
     * For making authenticated requests, use getValidAccessToken() instead.
     * @returns The access token or null if expired/not set
     */
    getAccessToken(): string | null {
        // Check if token is expired and clear if so
        if (this.isTokenExpired()) {
            this.clear();
            return null;
        }
        return this.accessToken;
    }

    /**
     * Clear stored tokens
     */
    clear() {
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.refreshPromise = null;
    }

    /**
     * Get a valid access token, refreshing if necessary
     * @returns Promise resolving to a valid access token or null
     */
    async getValidAccessToken(): Promise<string | null> {
        // If token is valid, return it
        if (!this.isTokenExpired()) {
            return this.accessToken;
        }

        // If already refreshing, wait for that
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        // Start refresh
        this.refreshPromise = this.refreshToken().finally(() => {
            this.refreshPromise = null;
        });

        return this.refreshPromise;
    }

    /**
     * Refresh the access token using the refresh token
     * @returns Promise resolving to the new access token or null
     */
    private async refreshToken(): Promise<string | null> {
        try {
            const response = await fetch(process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include cookies for refresh token
                body: JSON.stringify({
                    query: REFRESH_TOKEN_MUTATION
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const { data, errors } = await response.json();

            // Check for GraphQL errors
            if (errors && errors.length > 0) {
                throw new Error(`GraphQL error: ${errors[0].message}`);
            }

            const newToken = data?.refreshTokenMutation?.accessToken;

            if (newToken) {
                this.setAccessToken(newToken);
                return newToken;
            } else {
                throw new Error('No access token in refresh response');
            }
        } catch (error) {
            // Only log unexpected errors, not missing refresh token errors
            // "No refresh token provided" is expected when:
            // - User has never logged in
            // - User explicitly logged out (cookie was cleared)
            // - The refresh token expired after the configured expiration period
            // - Cookie was manually deleted by the user
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.includes('No refresh token provided')) {
                console.error('Token refresh failed:', error);
            }
            // Clear storage on failure
            this.clear();
            return null;
        }
    }
}

// Export singleton instance
export const tokenStorage = new TokenStorage();
