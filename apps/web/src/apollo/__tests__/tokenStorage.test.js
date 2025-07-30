import { tokenStorage } from '../tokenStorage';

describe('TokenStorage', () => {
    beforeEach(() => {
        tokenStorage.clear();
        jest.useRealTimers();
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
});
