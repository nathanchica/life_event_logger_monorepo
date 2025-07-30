// Token expiration constants
const DEFAULT_TOKEN_EXPIRY_SECONDS = 900; // 15 minutes
const TOKEN_EXPIRY_BUFFER_SECONDS = 30; // 30 second buffer before actual expiry
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Simple token storage service accessible by both React and non-React code.
 * Stores access tokens in memory only for security.
 */
class TokenStorage {
    private accessToken: string | null = null;
    private tokenExpiresAt: number | null = null;

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
     * Get the current access token if it's still valid
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
    }
}

// Export singleton instance
export const tokenStorage = new TokenStorage();
