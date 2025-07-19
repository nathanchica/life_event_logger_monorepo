import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useLoggableEvents } from '../../../hooks/useLoggableEvents';
import EventRecord from '../EventRecord';

jest.mock('../../../hooks/useLoggableEvents');

describe('EventRecord', () => {
    const eventId = '1';
    const recordDate = new Date('01-01-2023');
    const currentDate = new Date('01-02-2023');
    const mockRemoveTimestampFromEvent = jest.fn();
    let user;

    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();
        useLoggableEvents.mockReturnValue({
            removeTimestampFromEvent: mockRemoveTimestampFromEvent,
            removeTimestampIsLoading: false
        });
    });

    it('renders the date', () => {
        render(<EventRecord eventId={eventId} recordDate={recordDate} currentDate={currentDate} />);
        expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    });

    it('shows the dismiss icon on hover', async () => {
        render(<EventRecord eventId={eventId} recordDate={recordDate} currentDate={currentDate} />);
        const listItem = screen.getByText('1/1/2023').closest('li');
        await user.hover(listItem);
        expect(screen.getByLabelText(/dismiss record/i)).toBeInTheDocument();
        await user.unhover(listItem);
        expect(screen.queryByLabelText(/dismiss record/i)).not.toBeInTheDocument();
    });

    it('renders future dates', () => {
        render(
            <EventRecord eventId={eventId} recordDate={new Date('01-02-2023')} currentDate={new Date('01-01-2023')} />
        );
        expect(screen.getByText('1/2/2023')).toBeInTheDocument();
    });

    it('calls removeTimestampFromEvent when dismiss button is clicked', async () => {
        render(<EventRecord eventId={eventId} recordDate={recordDate} currentDate={currentDate} />);

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

        render(<EventRecord eventId={eventId} recordDate={recordDate} currentDate={currentDate} />);

        const listItem = screen.getByText('1/1/2023').closest('li');
        await user.hover(listItem);

        const dismissButton = screen.getByLabelText(/Dismiss record/);
        expect(dismissButton).toBeDisabled();
    });
});
