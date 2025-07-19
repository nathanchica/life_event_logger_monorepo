import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { DAYS_IN_YEAR, DAYS_IN_MONTH } from '../../../utils/time';
import LastEventDisplay from '../LastEventDisplay';

describe('LastEventDisplay', () => {
    const renderWithTheme = (component, isDarkMode = false) => {
        const theme = createTheme({
            palette: {
                mode: isDarkMode ? 'dark' : 'light'
            }
        });
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Text Display', () => {
        it.each([
            [0, 'Last event: Today'],
            [1, 'Last event: Yesterday'],
            [2, 'Last event: 2 days ago'],
            [7, 'Last event: 7 days ago'],
            [29, 'Last event: 29 days ago']
        ])('displays correct text for %i days since last event', (days, expectedText) => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={days} warningThresholdInDays={0} />);
            expect(screen.getByText(expectedText)).toBeInTheDocument();
        });

        it.each([
            [DAYS_IN_MONTH, 'Last event: 1 month ago'],
            [DAYS_IN_MONTH * 2, 'Last event: 2 months ago'],
            [DAYS_IN_MONTH * 11, 'Last event: 11 months ago']
        ])('displays months for %i days', (days, expectedText) => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={days} warningThresholdInDays={0} />);
            expect(screen.getByText(expectedText)).toBeInTheDocument();
        });

        it.each([
            [DAYS_IN_YEAR, 'Last event: 1 year ago'],
            [DAYS_IN_YEAR * 2, 'Last event: 2 years ago'],
            [DAYS_IN_YEAR * 5, 'Last event: 5 years ago']
        ])('displays years for %i days', (days, expectedText) => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={days} warningThresholdInDays={0} />);
            expect(screen.getByText(expectedText)).toBeInTheDocument();
        });
    });

    describe('Warning Threshold', () => {
        it('does not show warning icon when threshold is 0', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={10} warningThresholdInDays={0} />);
            expect(screen.queryByLabelText('Warning indicator')).not.toBeInTheDocument();
        });

        it('does not show warning icon when days are below threshold', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={5} warningThresholdInDays={10} />);
            expect(screen.queryByLabelText('Warning indicator')).not.toBeInTheDocument();
        });

        it('shows warning icon when days equal threshold', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={10} warningThresholdInDays={10} />);
            expect(screen.getByLabelText('Warning indicator')).toBeInTheDocument();
        });

        it('shows warning icon when days exceed threshold', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={15} warningThresholdInDays={10} />);
            expect(screen.getByLabelText('Warning indicator')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has correct role attribute', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={5} warningThresholdInDays={0} />);
            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('has correct aria-label when not violating threshold', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={5} warningThresholdInDays={10} />);
            const status = screen.getByRole('status');
            expect(status).toHaveAttribute('aria-label', 'Last event: 5 days ago');
            expect(status).toHaveAttribute('aria-live', 'off');
        });

        it('has warning aria-label when violating threshold', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={15} warningThresholdInDays={10} />);
            const status = screen.getByRole('status');
            expect(status).toHaveAttribute('aria-label', 'Warning: Last event: 15 days ago');
            expect(status).toHaveAttribute('aria-live', 'polite');
        });

        it('warning icon has correct accessibility attributes', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={15} warningThresholdInDays={10} />);
            const icon = screen.getByLabelText('Warning indicator');
            expect(icon).toHaveAttribute('role', 'img');
        });
    });

    describe('Theme Support', () => {
        it('renders correctly in light mode', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={15} warningThresholdInDays={10} />, false);
            expect(screen.getByText('Last event: 15 days ago')).toBeInTheDocument();
            expect(screen.getByLabelText('Warning indicator')).toBeInTheDocument();
        });

        it('renders correctly in dark mode', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={15} warningThresholdInDays={10} />, true);
            expect(screen.getByText('Last event: 15 days ago')).toBeInTheDocument();
            expect(screen.getByLabelText('Warning indicator')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles exactly one month boundary', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={DAYS_IN_MONTH} warningThresholdInDays={0} />);
            expect(screen.getByText('Last event: 1 month ago')).toBeInTheDocument();
        });

        it('handles exactly one year boundary', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={DAYS_IN_YEAR} warningThresholdInDays={0} />);
            expect(screen.getByText('Last event: 1 year ago')).toBeInTheDocument();
        });

        it('handles days just below month threshold', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={DAYS_IN_MONTH - 1} warningThresholdInDays={0} />);
            expect(screen.getByText(`Last event: ${DAYS_IN_MONTH - 1} days ago`)).toBeInTheDocument();
        });

        it('handles days just below year threshold', () => {
            renderWithTheme(<LastEventDisplay daysSinceLastEvent={DAYS_IN_YEAR - 1} warningThresholdInDays={0} />);
            const months = Math.floor((DAYS_IN_YEAR - 1) / DAYS_IN_MONTH);
            expect(screen.getByText(`Last event: ${months} months ago`)).toBeInTheDocument();
        });
    });
});
