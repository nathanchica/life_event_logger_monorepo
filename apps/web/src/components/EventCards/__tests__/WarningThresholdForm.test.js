import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WarningThresholdForm from '../WarningThresholdForm';

describe('WarningThresholdForm', () => {
    const mockOnChange = jest.fn();
    let user;

    beforeEach(() => {
        user = userEvent.setup();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders form with correct elements', () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            expect(screen.getByLabelText('Warning threshold')).toBeInTheDocument();
            expect(screen.getByLabelText('Unit')).toBeInTheDocument();
            expect(screen.getByLabelText('Warning threshold number')).toBeInTheDocument();
            expect(screen.getByLabelText('Warning threshold time unit')).toBeInTheDocument();
        });

        it.each([
            [1, 1, 'Days'],
            [15, 15, 'Days'],
            [29, 29, 'Days'],
            [30, 1, 'Months'],
            [45, 1, 'Months'], // 45 days = 1 month (floor)
            [60, 2, 'Months'],
            [90, 3, 'Months'],
            [330, 11, 'Months'], // 330 days = 11 months
            [359, 11, 'Months'], // 359 days = 11 months (floor)
            [360, 12, 'Months'], // 360 days = 12 months
            [364, 12, 'Months'], // 364 days = 12 months (floor)
            [365, 1, 'Years'], // 365 days = 1 year
            [366, 1, 'Years'], // 366 days = 1 year (floor)
            [730, 2, 'Years'], // 730 days = 2 years
            [1095, 3, 'Years'], // 1095 days = 3 years
            [3650, 10, 'Years'], // 3650 days = 10 years
            [4015, 11, 'Years'], // 4015 days = 11 years
            [7300, 20, 'Years'] // 7300 days = 20 years
        ])('converts %i days to %i %s', (initialDays, expectedNumber, expectedUnit) => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={initialDays} />);

            expect(screen.getByLabelText('Warning threshold number')).toHaveValue(expectedNumber);
            expect(screen.getByLabelText('Warning threshold time unit')).toHaveTextContent(expectedUnit);
        });

        it.each([
            [1, 'Days', 'Enter a number between 0-31', '31'],
            [30, 'Months', 'Enter a number between 0-12', '12'],
            [365, 'Years', 'Enter a number between 0-10', '10']
        ])(
            'renders correct helper text and max attribute for %i days (%s)',
            (initialDays, expectedUnit, expectedHelperText, expectedMax) => {
                render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={initialDays} />);

                expect(screen.getByText(expectedHelperText)).toBeInTheDocument();
                expect(screen.getByLabelText('Warning threshold number')).toHaveAttribute('max', expectedMax);
                expect(screen.getByLabelText('Warning threshold time unit')).toHaveTextContent(expectedUnit);
            }
        );
    });

    describe('Unit selection', () => {
        it('shows all unit options', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);

            expect(screen.getByRole('option', { name: 'Days' })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'Months' })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'Years' })).toBeInTheDocument();
        });

        it('updates helper text when unit changes to months', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Months' }));

            expect(screen.getByText('Enter a number between 0-12')).toBeInTheDocument();
        });

        it('updates helper text when unit changes to years', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Years' }));

            expect(screen.getByText('Enter a number between 0-10')).toBeInTheDocument();
        });

        it('updates input max attribute when unit changes', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const numberInput = screen.getByLabelText('Warning threshold number');
            const unitSelect = screen.getByLabelText('Warning threshold time unit');

            // Change to months
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Months' }));

            expect(numberInput).toHaveAttribute('max', '12');

            // Change to years
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Years' }));

            expect(numberInput).toHaveAttribute('max', '10');
        });
    });

    describe('Number input validation', () => {
        it('allows valid numbers within range for days', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const numberInput = screen.getByLabelText('Warning threshold number');

            await user.clear(numberInput);
            await user.type(numberInput, '15');

            expect(numberInput).toHaveValue(15);
            expect(mockOnChange).toHaveBeenCalledWith(15);
        });

        it('rejects numbers above maximum for days', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const numberInput = screen.getByLabelText('Warning threshold number');

            await user.clear(numberInput);
            await user.type(numberInput, '35');

            expect(numberInput).toHaveValue(3); // Only accepts valid part of the input
        });

        it('allows valid numbers within range for months', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Months' }));

            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);
            await user.type(numberInput, '6');

            expect(numberInput).toHaveValue(6);
            expect(mockOnChange).toHaveBeenCalledWith(180); // 6 * 30 days
        });

        it('rejects numbers above maximum for months', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Months' }));

            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);
            await user.type(numberInput, '15');

            expect(numberInput).toHaveValue(1); // Should remain at original value
        });

        it('allows valid numbers within range for years', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Years' }));

            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);
            await user.type(numberInput, '3');

            expect(numberInput).toHaveValue(3);
            expect(mockOnChange).toHaveBeenCalledWith(1095); // 3 * 365 days
        });

        it('rejects numbers above maximum for years', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Years' }));

            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);
            await user.type(numberInput, '15');

            expect(numberInput).toHaveValue(1); // Should remain at original value
        });

        it('handles empty input', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);

            expect(numberInput).toHaveValue(null);
            expect(mockOnChange).toHaveBeenCalledWith(0);
        });
    });

    describe('Unit change behavior', () => {
        it('resets number to 1 when changing unit if current value exceeds new maximum', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            // Set to maximum for days (31)
            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);
            await user.type(numberInput, '31');

            expect(numberInput).toHaveValue(31);

            // Change to months (max 12), should reset to 1
            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Months' }));

            expect(numberInput).toHaveValue(1);
            expect(mockOnChange).toHaveBeenCalledWith(30); // 1 * 30 days
        });

        it('preserves number when changing unit if current value is within new maximum', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            // Set to 5 for days
            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);
            await user.type(numberInput, '5');

            expect(numberInput).toHaveValue(5);

            // Change to months (max 12), should preserve 5
            const unitSelect = screen.getByLabelText('Warning threshold time unit');
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Months' }));

            expect(numberInput).toHaveValue(5);
            expect(mockOnChange).toHaveBeenCalledWith(150); // 5 * 30 days
        });
    });

    describe('Day calculations', () => {
        it('calculates correct days for different units', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const numberInput = screen.getByLabelText('Warning threshold number');
            const unitSelect = screen.getByLabelText('Warning threshold time unit');

            // Test days
            await user.clear(numberInput);
            await user.type(numberInput, '7');
            expect(mockOnChange).toHaveBeenCalledWith(7);

            // Test months
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Months' }));
            expect(mockOnChange).toHaveBeenCalledWith(210); // 7 * 30

            // Test years
            await user.click(unitSelect);
            await user.click(screen.getByRole('option', { name: 'Years' }));
            expect(mockOnChange).toHaveBeenCalledWith(2555); // 7 * 365
        });
    });

    describe('Edge cases', () => {
        it('handles zero values', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);

            expect(numberInput).toHaveValue(null);
            expect(mockOnChange).toHaveBeenCalledWith(0);
        });

        it('handles negative numbers by ignoring them', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const numberInput = screen.getByLabelText('Warning threshold number');

            await user.clear(numberInput);
            await user.type(numberInput, '-5');

            expect(numberInput).toHaveValue(null); // Invalid input results in empty field
        });

        it('handles non-numeric input', async () => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={1} />);

            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);
            await user.type(numberInput, 'abc');

            expect(numberInput).toHaveValue(null);
            expect(mockOnChange).toHaveBeenCalledWith(0);
        });

        it.each([
            [0, null, 'Days'], // Zero shows as empty field, stays as days
            [29, 29, 'Days'], // Just under 1 month, stays as days
            [30, 1, 'Months'], // Exactly 1 month
            [364, 12, 'Months'], // Just under 1 year, converts to 12 months
            [365, 1, 'Years'] // Exactly 1 year
        ])('handles boundary values: %i days converts to %i %s', (initialDays, expectedNumber, expectedUnit) => {
            render(<WarningThresholdForm onChange={mockOnChange} initialThresholdInDays={initialDays} />);

            expect(screen.getByLabelText('Warning threshold number')).toHaveValue(expectedNumber);
            expect(screen.getByLabelText('Warning threshold time unit')).toHaveTextContent(expectedUnit);
        });
    });
});
