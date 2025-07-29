import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, parseISO } from 'date-fns';

import EventDatepicker from '../EventDatepicker';

// Use fake timers to control the current date
beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(parseISO('2025-01-10')); // Set a fixed date for testing
});

afterAll(() => {
    jest.useRealTimers();
});

describe('EventDatepicker', () => {
    let user;
    const mockOnAccept = jest.fn();
    const mockOnClose = jest.fn();
    const eventId = 'test-event-123';
    const disabledDates = [parseISO('2025-01-01'), parseISO('2025-01-20'), parseISO('2025-02-01')];

    const defaultProps = {
        eventId,
        isShowing: true,
        disabledDates,
        onAccept: mockOnAccept,
        onClose: mockOnClose
    };

    const renderWithProviders = (props = {}) => {
        return render(
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <EventDatepicker {...defaultProps} {...props} />
            </LocalizationProvider>
        );
    };

    beforeEach(() => {
        user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        jest.clearAllMocks();
    });

    describe('Visibility', () => {
        it('shows content when isShowing is true', () => {
            renderWithProviders({ isShowing: true });

            expect(screen.getByLabelText(/event date/i)).toBeVisible();
            expect(screen.getByRole('button', { name: /confirm date selection/i })).toBeVisible();
            const dateInput = screen.getByLabelText(/event date/i);
            expect(dateInput).toHaveValue('01/10/2025'); // Should default to the current day
        });

        it('hides content when isShowing is false', () => {
            renderWithProviders({ isShowing: false });

            const dateInput = screen.getByLabelText(/event date/i);
            const confirmButton = screen.getByLabelText(/confirm date selection/i);

            expect(dateInput).toBeInTheDocument();
            expect(dateInput).not.toBeVisible();
            expect(confirmButton).toBeInTheDocument();
            expect(confirmButton).not.toBeVisible();
        });

        it('defaults to previous date when current date is in disabled dates', () => {
            renderWithProviders({ disabledDates: [parseISO('2025-01-10')] });

            const dateInput = screen.getByLabelText(/event date/i);
            expect(dateInput).toHaveValue('01/09/2025'); // Should default to the previous day
        });

        it('defaults to a valid date when current date and previous days are in disabled dates', () => {
            renderWithProviders({
                disabledDates: [parseISO('2025-01-10'), parseISO('2025-01-09'), parseISO('2025-01-08')]
            });

            const dateInput = screen.getByLabelText(/event date/i);
            expect(dateInput).toHaveValue('01/07/2025'); // Should default to a valid day in the past
        });
    });

    describe('User Interactions', () => {
        it('shows mocked default date and allows changing by typing', async () => {
            renderWithProviders();

            const dateInput = screen.getByLabelText(/event date/i);

            // Verify the mocked default date appears
            expect(dateInput).toHaveValue('01/10/2025');

            // Clear the existing date and type a new one
            await user.clear(dateInput);
            await user.type(dateInput, '01/15/2025');

            // Verify the date was entered
            expect(dateInput).toHaveValue('01/15/2025');
        });

        it('handles pressing enter key on clear input', async () => {
            renderWithProviders();

            expect(screen.getByLabelText(/confirm date selection/i)).not.toBeDisabled();
            const dateInput = screen.getByLabelText(/event date/i);

            // Clear the input and press Enter
            await user.clear(dateInput);
            await user.keyboard('{Enter}');

            expect(screen.getByLabelText(/confirm date selection/i)).toBeDisabled();
        });

        it('disables confirm button when disabled dates are entered', async () => {
            renderWithProviders({ disabledDates: [parseISO('2025-01-01')] });

            expect(screen.queryByText(/Selected date is already logged/)).not.toBeInTheDocument();
            const dateInput = screen.getByLabelText(/event date/i);
            const confirmButton = screen.getByRole('button', { name: /confirm date selection/i });

            // Type a disabled date
            await user.clear(dateInput);
            await user.type(dateInput, '01/01/2025'); // A disabled date

            expect(confirmButton).toBeDisabled();
            expect(screen.getByText(/Selected date is already logged/)).toBeInTheDocument();
        });

        it('calls onAccept with valid date when confirm button is clicked', async () => {
            renderWithProviders();

            const dateInput = screen.getByLabelText(/event date/i);
            const confirmButton = screen.getByRole('button', { name: /confirm date selection/i });

            // Type a valid date
            await user.clear(dateInput);
            await user.type(dateInput, '01/15/2025');

            // Click confirm button
            await user.click(confirmButton);

            expect(mockOnAccept).toHaveBeenCalledTimes(1);
            const calledDate = mockOnAccept.mock.lastCall[0];
            expect(format(calledDate, 'yyyy-MM-dd')).toBe('2025-01-15');
        });

        it('selects date using MUI DatePicker dialog', async () => {
            renderWithProviders();

            const dateInput = screen.getByLabelText(/event date/i);

            // Verify initial value
            expect(dateInput).toHaveValue('01/10/2025');

            // Click on the calendar icon button to open the date picker dialog
            const calendarButton = screen.getByRole('button', { name: /choose date/i });
            await user.click(calendarButton);

            // Try to find and click a date in the calendar
            // Look for day 15 in the calendar
            const day15Button = await screen.findByRole('gridcell', { name: /15/ });
            await user.click(day15Button);

            // Verify the date input was updated
            expect(dateInput).toHaveValue('01/15/2025');
        });
    });

    describe('Props', () => {
        it.each([
            ['empty disabled dates', []],
            ['single disabled date', [parseISO('2025-01-01')]],
            ['multiple disabled dates', disabledDates]
        ])('handles %s', (_, dates) => {
            renderWithProviders({ disabledDates: dates });

            expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /confirm date selection/i })).toBeInTheDocument();
        });

        it.each([['event-1'], ['event-2'], ['test-event-123'], ['special-event-!@#']])(
            'renders correctly for event ID: %s',
            (eventId) => {
                renderWithProviders({ eventId });

                expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /confirm date selection/i })).toBeInTheDocument();
            }
        );
    });
});
