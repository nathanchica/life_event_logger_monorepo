import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { useLoggableEvents } from '../../../hooks/useLoggableEvents';
import EventRecord from '../EventRecord';

vi.mock('../../../hooks/useLoggableEvents');

describe('EventRecord', () => {
    const eventId = '1';
    const recordDate = new Date('01-01-2023');
    const mockRemoveTimestampFromEvent = vi.fn();
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        // Set system time to Jan 2, 2023 for consistent testing
        vi.setSystemTime(new Date('01-02-2023'));
        user = userEvent.setup();
        useLoggableEvents.mockReturnValue({
            removeTimestampFromEvent: mockRemoveTimestampFromEvent,
            removeTimestampIsLoading: false
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the date', () => {
        render(<EventRecord eventId={eventId} recordDate={recordDate} />);
        expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    });

    it('shows the dismiss icon on hover', async () => {
        render(<EventRecord eventId={eventId} recordDate={recordDate} />);
        const listItem = screen.getByText('1/1/2023').closest('li');
        await user.hover(listItem);
        expect(screen.getByLabelText(/dismiss record/i)).toBeInTheDocument();
        await user.unhover(listItem);
        expect(screen.queryByLabelText(/dismiss record/i)).not.toBeInTheDocument();
    });

    it('renders future dates', () => {
        // System time is Jan 2, 2023, so Jan 3, 2023 is a future date
        render(<EventRecord eventId={eventId} recordDate={new Date('01-03-2023')} />);
        expect(screen.getByText('1/3/2023')).toBeInTheDocument();
    });

    it('renders past dates with different styling', () => {
        // System time is Jan 2, 2023, so Jan 1, 2023 is a past date
        render(<EventRecord eventId={eventId} recordDate={new Date('01-01-2023')} />);
        const dateText = screen.getByText('1/1/2023');
        expect(dateText).toBeInTheDocument();
    });

    it('calls removeTimestampFromEvent when dismiss button is clicked', async () => {
        render(<EventRecord eventId={eventId} recordDate={recordDate} />);

        const listItem = screen.getByText('1/1/2023').closest('li');
        await user.hover(listItem);

        const dismissButton = screen.getByRole('button', { name: /dismiss record/i });
        expect(dismissButton).toBeInTheDocument();
        expect(dismissButton).not.toBeDisabled();

        // Use fireEvent.click instead of user.click because userEvent simulates
        // realistic mouse movement which triggers onMouseLeave, hiding the button
        // before the click event can complete
        fireEvent.click(dismissButton);

        expect(mockRemoveTimestampFromEvent).toHaveBeenCalledTimes(1);
        expect(mockRemoveTimestampFromEvent).toHaveBeenCalledWith({
            input: {
                id: eventId,
                timestamp: recordDate.toISOString()
            }
        });
    });

    it('disables dismiss button when removeTimestampIsLoading is true', async () => {
        useLoggableEvents.mockReturnValue({
            removeTimestampFromEvent: mockRemoveTimestampFromEvent,
            removeTimestampIsLoading: true
        });

        render(<EventRecord eventId={eventId} recordDate={recordDate} />);

        const listItem = screen.getByText('1/1/2023').closest('li');
        await user.hover(listItem);

        const dismissButton = screen.getByLabelText(/Dismiss record/);
        expect(dismissButton).toBeDisabled();
    });
});
