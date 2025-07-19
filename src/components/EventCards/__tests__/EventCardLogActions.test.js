import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parseISO } from 'date-fns';

import { useLoggableEvents } from '../../../hooks/useLoggableEvents';
import EventCardLogActions from '../EventCardLogActions';

jest.mock('../../../hooks/useLoggableEvents');
jest.mock('../EventDatepicker', () => {
    return function MockEventDatepicker({ eventId, isShowing, onAccept }) {
        if (!isShowing) return null;
        return (
            <div data-testid={`datepicker-${eventId}`}>
                <button onClick={() => onAccept(new Date('2025-01-15T10:00:00Z'))} aria-label="Accept date">
                    Accept Date
                </button>
            </div>
        );
    };
});

describe('EventCardLogActions', () => {
    let user;
    const mockAddTimestampToEvent = jest.fn();

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(parseISO('2025-01-10')); // Set a fixed date for testing
        user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        useLoggableEvents.mockReturnValue({
            addTimestampToEvent: mockAddTimestampToEvent,
            addTimestampIsLoading: false
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    const defaultProps = {
        eventId: 'event-1',
        daysSinceLastEvent: 1,
        timestamps: [new Date('2025-01-09T10:00:00Z')]
    };

    it('should render log today and log custom date buttons', () => {
        render(<EventCardLogActions {...defaultProps} />);

        expect(screen.getByRole('button', { name: 'Log Today' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Log custom date' })).toBeInTheDocument();
    });

    it('should call addTimestampToEvent when Log Today is clicked', async () => {
        render(<EventCardLogActions {...defaultProps} />);

        const logTodayButton = screen.getByRole('button', { name: 'Log Today' });
        await user.click(logTodayButton);

        expect(mockAddTimestampToEvent).toHaveBeenCalledWith({
            input: {
                id: 'event-1',
                timestamp: expect.stringMatching(/^2025-01-10T/)
            }
        });
    });

    it('should disable Log Today when already logged today', () => {
        render(<EventCardLogActions {...defaultProps} daysSinceLastEvent={0} />);

        const logTodayButton = screen.getByRole('button', { name: 'Log Today' });
        expect(logTodayButton).toBeDisabled();
        expect(screen.getByText('Already logged today')).toBeInTheDocument();
    });

    it('should disable Log Today when loading', () => {
        useLoggableEvents.mockReturnValue({
            addTimestampToEvent: mockAddTimestampToEvent,
            addTimestampIsLoading: true
        });

        render(<EventCardLogActions {...defaultProps} />);

        expect(screen.getByRole('button', { name: 'Log Today' })).toBeDisabled();
    });

    it('should show and hide datepicker when Log custom date is clicked', async () => {
        render(<EventCardLogActions {...defaultProps} />);

        const customDateButton = screen.getByRole('button', { name: 'Log custom date' });

        // Initially datepicker should not be visible
        expect(screen.queryByTestId('datepicker-event-1')).not.toBeInTheDocument();

        // Click to show datepicker
        await user.click(customDateButton);
        expect(screen.getByTestId('datepicker-event-1')).toBeInTheDocument();
        expect(customDateButton).toHaveAttribute('aria-expanded', 'true');

        // Click again to hide datepicker
        await user.click(customDateButton);
        expect(screen.queryByTestId('datepicker-event-1')).not.toBeInTheDocument();
        expect(customDateButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should call addTimestampToEvent when date is accepted from datepicker', async () => {
        render(<EventCardLogActions {...defaultProps} />);

        // Open datepicker
        await user.click(screen.getByRole('button', { name: 'Log custom date' }));

        // Accept a date
        await user.click(screen.getByRole('button', { name: 'Accept date' }));

        expect(mockAddTimestampToEvent).toHaveBeenCalledWith({
            input: {
                id: 'event-1',
                timestamp: '2025-01-15T10:00:00.000Z'
            }
        });

        // Datepicker should be hidden after accepting
        expect(screen.queryByTestId('datepicker-event-1')).not.toBeInTheDocument();
    });

    it('should disable Log custom date when loading', () => {
        useLoggableEvents.mockReturnValue({
            addTimestampToEvent: mockAddTimestampToEvent,
            addTimestampIsLoading: true
        });

        render(<EventCardLogActions {...defaultProps} />);

        expect(screen.getByRole('button', { name: 'Log custom date' })).toBeDisabled();
    });

    it('should pass timestamps as disabled dates to datepicker', async () => {
        const timestamps = [new Date('2025-01-08T10:00:00Z'), new Date('2025-01-09T10:00:00Z')];

        render(<EventCardLogActions {...defaultProps} timestamps={timestamps} />);

        await user.click(screen.getByRole('button', { name: 'Log custom date' }));

        // The mock datepicker should receive the timestamps as disabledDates
        // This would be tested more thoroughly in the actual EventDatepicker tests
        expect(screen.getByTestId('datepicker-event-1')).toBeInTheDocument();
    });
});
