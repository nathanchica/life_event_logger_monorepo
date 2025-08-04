import { tokenStorage } from '../tokenStorage';

// Mock fetch for testing
global.fetch = jest.fn();

describe('TokenStorage', () => {
    beforeEach(() => {
        tokenStorage.clear();
        jest.useRealTimers();
        fetch.mockClear();
    });

    describe('basic functionality', () => {
        it('stores and retrieves access token', () => {
            const token = 'test-token-123';
            tokenStorage.setAccessToken(token);

            expect(tokenStorage.getAccessToken()).toBe(token);
        });

        it('returns null when no token is set', () => {
            expect(tokenStorage.getAccessToken()).toBeNull();
        });

        it('clears stored token', () => {
            tokenStorage.setAccessToken('token-to-clear');
            tokenStorage.clear();

            expect(tokenStorage.getAccessToken()).toBeNull();
        });
    });

    describe('token expiration', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        it('returns null and clears token when expired', () => {
            const token = 'expired-token';
            tokenStorage.setAccessToken(token, 60); // 60 seconds

            // Token should be valid initially
            expect(tokenStorage.getAccessToken()).toBe(token);

            // Advance time past expiry (60 - 30 buffer + 1 = 31 seconds)
            jest.advanceTimersByTime(31 * 1000);

            // Token should now be expired and cleared
            expect(tokenStorage.getAccessToken()).toBeNull();
        });

        it('applies 30 second buffer to expiry time', () => {
            const token = 'buffer-test-token';
            tokenStorage.setAccessToken(token, 100); // 100 seconds

            // Advance to just before buffer kicks in (100 - 30 - 1 = 69 seconds)
            jest.advanceTimersByTime(69 * 1000);
            expect(tokenStorage.getAccessToken()).toBe(token);

            // Advance past buffer (2 more seconds)
            jest.advanceTimersByTime(2 * 1000);
            expect(tokenStorage.getAccessToken()).toBeNull();
        });

        it('immediately expires token when expiry is less than buffer', () => {
            const token = 'short-lived-token';

            // Set token with expiry less than buffer (20 seconds < 30 second buffer)
            tokenStorage.setAccessToken(token, 20);

            // Token should be immediately expired
            expect(tokenStorage.getAccessToken()).toBeNull();
        });
    });

    describe('token replacement', () => {
        it('replaces existing token with new one', () => {
            tokenStorage.setAccessToken('first-token');
            tokenStorage.setAccessToken('second-token');

            expect(tokenStorage.getAccessToken()).toBe('second-token');
        });
    });

    describe('getValidAccessToken', () => {
        // Store original env var
        const originalEnv = process.env.REACT_APP_GRAPHQL_URL;

        afterEach(() => {
            // Restore original env var after each test
            process.env.REACT_APP_GRAPHQL_URL = originalEnv;
        });

        it('returns existing token when not expired', async () => {
            const token = 'valid-token';
            tokenStorage.setAccessToken(token, 900); // 15 minutes

            const result = await tokenStorage.getValidAccessToken();

            expect(result).toBe(token);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('refreshes token when expired', async () => {
            const oldToken = 'expired-token';
            const newToken = 'new-token';

            // Set expired token
            tokenStorage.setAccessToken(oldToken, 0);

            // Mock successful refresh
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        refreshTokenMutation: {
                            accessToken: newToken
                        }
                    }
                })
            });

            const result = await tokenStorage.getValidAccessToken();

            expect(result).toBe(newToken);
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:4000/graphql',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: expect.stringContaining('refreshTokenMutation')
                })
            );

            // Verify token was stored
            expect(tokenStorage.getAccessToken()).toBe(newToken);
        });

        describe('error handling', () => {
            let consoleSpy;

            beforeEach(() => {
                consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            });

            afterEach(() => {
                consoleSpy.mockRestore();
            });

            it('returns null when refresh fails with HTTP error', async () => {
                tokenStorage.setAccessToken('expired-token', 0);

                // Mock failed refresh (401 Unauthorized)
                fetch.mockResolvedValueOnce({
                    ok: false,
                    status: 401
                });

                const result = await tokenStorage.getValidAccessToken();

                expect(result).toBeNull();
                expect(tokenStorage.getAccessToken()).toBeNull();
                expect(consoleSpy).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
            });

            it('returns null when refresh fails with GraphQL errors', async () => {
                tokenStorage.setAccessToken('expired-token', 0);

                // Mock GraphQL error response
                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        errors: [
                            {
                                message: 'Invalid refresh token'
                            }
                        ]
                    })
                });

                const result = await tokenStorage.getValidAccessToken();

                expect(result).toBeNull();
                expect(tokenStorage.getAccessToken()).toBeNull();
                expect(consoleSpy).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
            });

            it('returns null when refresh response has no token', async () => {
                tokenStorage.setAccessToken('expired-token', 0);

                // Mock response with no token
                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        data: {
                            refreshTokenMutation: {}
                        }
                    })
                });

                const result = await tokenStorage.getValidAccessToken();

                expect(result).toBeNull();
                expect(consoleSpy).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
            });

            it('logs error when refresh fails with other errors', async () => {
                tokenStorage.setAccessToken('expired-token', 0);

                // Mock response with a different error
                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        errors: [
                            {
                                message: 'Some other error occurred'
                            }
                        ]
                    })
                });

                const result = await tokenStorage.getValidAccessToken();

                expect(result).toBeNull();
                expect(tokenStorage.getAccessToken()).toBeNull();
                expect(consoleSpy).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
            });

            it('handles non-Error objects thrown during refresh', async () => {
                tokenStorage.setAccessToken('expired-token', 0);

                // Mock fetch to throw a non-Error object (e.g., string)
                fetch.mockRejectedValueOnce('Network error string');

                const result = await tokenStorage.getValidAccessToken();

                expect(result).toBeNull();
                expect(tokenStorage.getAccessToken()).toBeNull();
                expect(consoleSpy).toHaveBeenCalledWith('Token refresh failed:', 'Network error string');
            });

            it('does not log error when refresh fails with "No refresh token provided"', async () => {
                tokenStorage.setAccessToken('expired-token', 0);

                // Mock response with "No refresh token provided" error
                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        errors: [
                            {
                                message: 'No refresh token provided'
                            }
                        ]
                    })
                });

                const result = await tokenStorage.getValidAccessToken();

                expect(result).toBeNull();
                expect(tokenStorage.getAccessToken()).toBeNull();
                expect(consoleSpy).not.toHaveBeenCalled();
            });

            it('does not log non-Error objects with "No refresh token provided" message', async () => {
                tokenStorage.setAccessToken('expired-token', 0);

                // Mock fetch to throw a string containing "No refresh token provided"
                fetch.mockRejectedValueOnce('Error: No refresh token provided');

                const result = await tokenStorage.getValidAccessToken();

                expect(result).toBeNull();
                expect(tokenStorage.getAccessToken()).toBeNull();
                expect(consoleSpy).not.toHaveBeenCalled();
            });

            it('clears refresh promise even when refresh fails, allowing retry', async () => {
                tokenStorage.setAccessToken('expired-token', 0);

                // First attempt fails
                fetch.mockResolvedValueOnce({
                    ok: false,
                    status: 500
                });

                // First call should fail
                const result1 = await tokenStorage.getValidAccessToken();
                expect(result1).toBeNull();
                expect(fetch).toHaveBeenCalledTimes(1);

                // Second attempt succeeds
                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        data: {
                            refreshTokenMutation: {
                                accessToken: 'recovered-token'
                            }
                        }
                    })
                });

                // Second call should retry (not reuse failed promise)
                const result2 = await tokenStorage.getValidAccessToken();
                expect(result2).toBe('recovered-token');
                expect(fetch).toHaveBeenCalledTimes(2);
            });
        });

        it('handles concurrent refresh requests', async () => {
            tokenStorage.setAccessToken('expired-token', 0);

            const newToken = 'refreshed-token';
            let resolveFetch;
            const fetchPromise = new Promise((resolve) => {
                resolveFetch = resolve;
            });

            fetch.mockReturnValueOnce(fetchPromise);

            // Start multiple concurrent refresh attempts
            const promise1 = tokenStorage.getValidAccessToken();
            const promise2 = tokenStorage.getValidAccessToken();
            const promise3 = tokenStorage.getValidAccessToken();

            // Should only call fetch once
            expect(fetch).toHaveBeenCalledTimes(1);

            // Resolve the fetch
            resolveFetch({
                ok: true,
                json: async () => ({
                    data: {
                        refreshTokenMutation: {
                            accessToken: newToken
                        }
                    }
                })
            });

            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

            // All should get the same token
            expect(result1).toBe(newToken);
            expect(result2).toBe(newToken);
            expect(result3).toBe(newToken);

            // Fetch should still only have been called once
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('clears refresh promise after completion', async () => {
            tokenStorage.setAccessToken('expired-token', 0);

            // Mock successful refresh
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        refreshTokenMutation: {
                            accessToken: 'new-token'
                        }
                    }
                })
            });

            await tokenStorage.getValidAccessToken();

            // Set token expired again
            tokenStorage.setAccessToken('another-expired-token', 0);

            // Mock another refresh
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        refreshTokenMutation: {
                            accessToken: 'another-new-token'
                        }
                    }
                })
            });

            await tokenStorage.getValidAccessToken();

            // Fetch should have been called twice (not reusing old promise)
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        it('uses environment variable URL when available', async () => {
            // Set custom GraphQL URL
            process.env.REACT_APP_GRAPHQL_URL = 'https://api.example.com/graphql';

            tokenStorage.setAccessToken('expired-token', 0);

            // Mock successful refresh
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        refreshTokenMutation: {
                            accessToken: 'new-token'
                        }
                    }
                })
            });

            await tokenStorage.getValidAccessToken();

            // Should use environment variable URL
            expect(fetch).toHaveBeenCalledWith(
                'https://api.example.com/graphql',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: expect.stringContaining('refreshTokenMutation')
                })
            );
        });

        it('uses default URL when environment variable is not set', async () => {
            // Clear environment variable
            delete process.env.REACT_APP_GRAPHQL_URL;

            tokenStorage.setAccessToken('expired-token', 0);

            // Mock successful refresh
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        refreshTokenMutation: {
                            accessToken: 'new-token'
                        }
                    }
                })
            });

            await tokenStorage.getValidAccessToken();

            // Should use default localhost URL
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:4000/graphql',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: expect.stringContaining('refreshTokenMutation')
                })
            );
        });
    });
});
