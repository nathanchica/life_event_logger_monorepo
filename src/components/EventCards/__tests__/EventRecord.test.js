import { render, screen, fireEvent } from '@testing-library/react';

import { createMockLoggableEvent } from '../../../mocks/loggableEvent';
import { createMockLoggableEventsContextValue } from '../../../mocks/providers';
import { LoggableEventsContext } from '../../../providers/LoggableEventsProvider';
import EventRecord from '../EventRecord';

describe('EventRecord', () => {
    const eventId = '1';
    const recordDate = new Date('01-01-2023');
    const currentDate = new Date('01-02-2023');

    const mockUpdateLoggableEventDetails = jest.fn();
    const mockLoggableEvent = createMockLoggableEvent({
        id: eventId,
        timestamps: [new Date('01-01-2023'), new Date('01-02-2023')],
        name: 'Test Event',
        warningThresholdInDays: 0
    });

    const mockContextValue = createMockLoggableEventsContextValue({
        loggableEvents: [mockLoggableEvent],
        updateLoggableEventDetails: mockUpdateLoggableEventDetails
    });

    const renderWithProviders = (component) => {
        return render(
            <LoggableEventsContext.Provider value={mockContextValue}>{component}</LoggableEventsContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the date', () => {
        renderWithProviders(<EventRecord eventId={eventId} recordDate={recordDate} currentDate={currentDate} />);
        expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    });

    it('shows the dismiss icon on hover', () => {
        renderWithProviders(<EventRecord eventId={eventId} recordDate={recordDate} currentDate={currentDate} />);
        const listItem = screen.getByText('1/1/2023').closest('li');
        fireEvent.mouseEnter(listItem);
        expect(screen.getByLabelText(/Dismiss record/)).toBeInTheDocument();
        fireEvent.mouseLeave(listItem);
        expect(screen.queryByLabelText(/Dismiss record/)).not.toBeInTheDocument();
    });

    it('calls updateLoggableEventDetails when dismiss icon is clicked', () => {
        renderWithProviders(<EventRecord eventId={eventId} recordDate={recordDate} currentDate={currentDate} />);
        const listItem = screen.getByText('1/1/2023').closest('li');
        fireEvent.mouseEnter(listItem);
        const button = screen.getByLabelText(/Dismiss record/i);
        fireEvent.click(button);
        expect(mockUpdateLoggableEventDetails).toHaveBeenCalled();
    });

    it('renders future dates', () => {
        renderWithProviders(
            <EventRecord eventId={eventId} recordDate={new Date('01-02-2023')} currentDate={new Date('01-01-2023')} />
        );
        expect(screen.getByText('1/2/2023')).toBeInTheDocument();
    });
});
