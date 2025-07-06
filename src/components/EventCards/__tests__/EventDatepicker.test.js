import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EventDatepicker from '../EventDatepicker';

describe('EventDatepicker', () => {
    const mockOnAccept = jest.fn();
    const mockOnClose = jest.fn();
    const eventId = 'test-event-123';
    const disabledDates = [new Date('2023-01-01'), new Date('2023-01-15'), new Date('2023-02-01')];

    const defaultProps = {
        eventId,
        isShowing: true,
        disabledDates,
        onAccept: mockOnAccept,
        onClose: mockOnClose
    };

    const renderWithProviders = (props = {}) => {
        return render(
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <EventDatepicker {...defaultProps} {...props} />
            </LocalizationProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Visibility', () => {
        it('shows content when isShowing is true', () => {
            renderWithProviders({ isShowing: true });

            expect(screen.getByLabelText(/event date/i)).toBeVisible();
            expect(screen.getByRole('button', { name: /cancel date selection/i })).toBeVisible();
        });

        it('hides content when isShowing is false', () => {
            renderWithProviders({ isShowing: false });

            const dateInput = screen.getByLabelText(/event date/i);
            const cancelButton = screen.getByLabelText(/cancel date selection/i);

            expect(dateInput).toBeInTheDocument();
            expect(dateInput).not.toBeVisible();
            expect(cancelButton).toBeInTheDocument();
            expect(cancelButton).not.toBeVisible();
        });
    });

    describe('Rendering', () => {
        it('renders all required elements', () => {
            renderWithProviders();

            // Date picker elements
            expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
            expect(screen.getByText('Pick a date to log an event for')).toBeInTheDocument();

            // Accessibility elements
            expect(screen.getByRole('button', { name: /cancel date selection/i })).toBeInTheDocument();
            expect(screen.getByText('Dates already logged are disabled')).toBeInTheDocument();
        });

        it('renders date input as readonly text field', () => {
            renderWithProviders();

            const dateInput = screen.getByLabelText(/event date/i);
            expect(dateInput).toHaveAttribute('type', 'text');
            expect(dateInput).toHaveAttribute('readonly');
        });
    });

    describe('User Interactions', () => {
        it('calls onClose when cancel button is clicked', async () => {
            renderWithProviders();

            const cancelButton = screen.getByRole('button', { name: /cancel date selection/i });
            await userEvent.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('accepts current date when picker is used', async () => {
            renderWithProviders();

            // Click the date input to open picker
            const dateInput = screen.getByLabelText(/event date/i);
            await userEvent.click(dateInput);

            // Find and click OK button in the date picker dialog
            const okButton = await screen.findByRole('button', { name: /ok/i });
            await userEvent.click(okButton);
            expect(mockOnAccept).toHaveBeenCalled();
        });
    });

    describe('Props', () => {
        it.each([
            ['empty disabled dates', []],
            ['single disabled date', [new Date('2023-01-01')]],
            ['multiple disabled dates', disabledDates]
        ])('handles %s', (_, dates) => {
            renderWithProviders({ disabledDates: dates });

            expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel date selection/i })).toBeInTheDocument();
        });

        it.each([['event-1'], ['event-2'], ['test-event-123'], ['special-event-!@#']])(
            'renders correctly for event ID: %s',
            (eventId) => {
                renderWithProviders({ eventId });

                expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /cancel date selection/i })).toBeInTheDocument();
            }
        );
    });
});
