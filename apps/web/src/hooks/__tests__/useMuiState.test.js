import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { renderHook } from '@testing-library/react';

import useMuiState from '../useMuiState';

// Mock useMediaQuery
jest.mock('@mui/material/useMediaQuery');

describe('useMuiState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createWrapper = (themeOptions = {}) => {
        const theme = createTheme(themeOptions);
        return ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;
    };

    describe('theme property', () => {
        it('returns the current theme object', () => {
            useMediaQuery.mockReturnValue(false);
            const wrapper = createWrapper();

            const { result } = renderHook(() => useMuiState(), { wrapper });

            expect(result.current.theme).toBeDefined();
            expect(result.current.theme.palette).toBeDefined();
            expect(result.current.theme.breakpoints).toBeDefined();
        });

        it('returns theme with custom palette when provided', () => {
            useMediaQuery.mockReturnValue(false);
            const customPalette = {
                palette: {
                    primary: {
                        main: '#ff0000'
                    }
                }
            };
            const wrapper = createWrapper(customPalette);

            const { result } = renderHook(() => useMuiState(), { wrapper });

            expect(result.current.theme.palette.primary.main).toBe('#ff0000');
        });
    });

    describe('isMobile property', () => {
        it.each([
            ['returns true when screen is mobile size', true],
            ['returns false when screen is not mobile size', false]
        ])('%s', (_, isMobile) => {
            useMediaQuery.mockReturnValue(isMobile);
            const wrapper = createWrapper();

            const { result } = renderHook(() => useMuiState(), { wrapper });

            expect(result.current.isMobile).toBe(isMobile);
        });
    });

    describe('isDarkMode property', () => {
        it.each([
            ['returns true when theme mode is dark', 'dark', true],
            ['returns false when theme mode is light', 'light', false],
            ['returns false when theme mode is undefined', undefined, false]
        ])('%s', (_, mode, expectedResult) => {
            useMediaQuery.mockReturnValue(false);
            const themeOptions = mode ? { palette: { mode } } : {};
            const wrapper = createWrapper(themeOptions);

            const { result } = renderHook(() => useMuiState(), { wrapper });

            expect(result.current.isDarkMode).toBe(expectedResult);
        });
    });

    describe('hook return value', () => {
        it('returns all three properties in a single object', () => {
            useMediaQuery.mockReturnValue(true);
            const wrapper = createWrapper({ palette: { mode: 'dark' } });

            const { result } = renderHook(() => useMuiState(), { wrapper });

            expect(result.current).toEqual({
                theme: expect.objectContaining({
                    palette: expect.objectContaining({ mode: 'dark' })
                }),
                isMobile: true,
                isDarkMode: true
            });
        });

        it('maintains stable references when theme does not change', () => {
            useMediaQuery.mockReturnValue(false);
            const wrapper = createWrapper();

            const { result, rerender } = renderHook(() => useMuiState(), { wrapper });
            const firstResult = result.current;

            rerender();
            const secondResult = result.current;

            expect(firstResult.theme).toBe(secondResult.theme);
        });
    });

    describe('responsive behavior', () => {
        it('updates isMobile when media query changes', () => {
            useMediaQuery.mockReturnValue(false);
            const wrapper = createWrapper();

            const { result, rerender } = renderHook(() => useMuiState(), { wrapper });
            expect(result.current.isMobile).toBe(false);

            // Simulate screen size change
            useMediaQuery.mockReturnValue(true);
            rerender();

            expect(result.current.isMobile).toBe(true);
        });
    });

    describe('integration scenarios', () => {
        it('works correctly with light theme and desktop view', () => {
            useMediaQuery.mockReturnValue(false);
            const wrapper = createWrapper({ palette: { mode: 'light' } });

            const { result } = renderHook(() => useMuiState(), { wrapper });

            expect(result.current.isDarkMode).toBe(false);
            expect(result.current.isMobile).toBe(false);
            expect(result.current.theme.palette.mode).toBe('light');
        });

        it('works correctly with dark theme and mobile view', () => {
            useMediaQuery.mockReturnValue(true);
            const wrapper = createWrapper({ palette: { mode: 'dark' } });

            const { result } = renderHook(() => useMuiState(), { wrapper });

            expect(result.current.isDarkMode).toBe(true);
            expect(result.current.isMobile).toBe(true);
            expect(result.current.theme.palette.mode).toBe('dark');
        });

        it('handles custom theme with additional properties', () => {
            useMediaQuery.mockReturnValue(false);
            const customTheme = {
                palette: {
                    mode: 'light',
                    custom: {
                        specialColor: '#123456'
                    }
                }
            };
            const wrapper = createWrapper(customTheme);

            const { result } = renderHook(() => useMuiState(), { wrapper });

            expect(result.current.theme.palette.custom.specialColor).toBe('#123456');
            expect(typeof result.current.theme.spacing).toBe('function');
        });
    });
});
