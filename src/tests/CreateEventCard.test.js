import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import CreateEventCard from '../components/EventCards/CreateEventCard';
import { LoggableEventsContext } from '../providers/LoggableEventsProvider';
import { ViewOptionsContext } from '../providers/ViewOptionsProvider';

describe('CreateEventCard', () => {
    const mockEventLabels = [
        { id: 'label-1', name: 'Work' },
        { id: 'label-2', name: 'Personal' }
    ];

    const mockCreateLoggableEvent = jest.fn();

    function renderWithProvider(ui, options = {}) {
        const { eventLabels = mockEventLabels } = options;

        const mockLoggableEventsContextValue = {
            loggableEvents: [],
            createLoggableEvent: mockCreateLoggableEvent,
            updateLoggableEventDetails: jest.fn(),
            deleteLoggableEvent: jest.fn(),
            logEvent: jest.fn(),
            deleteEventTimestamp: jest.fn(),
            addTimestampToEvent: jest.fn(),
            removeLoggableEvent: jest.fn(),
            eventLabels,
            createEventLabel: jest.fn(),
            deleteEventLabel: jest.fn(),
            offlineMode: true
        };

        const mockViewOptionsContextValue = {
            activeEventLabelId: null,
            setActiveEventLabelId: jest.fn(),
            offlineMode: true
        };

        return render(
            <MockedProvider mocks={[]} addTypename={false}>
                <LoggableEventsContext.Provider value={mockLoggableEventsContextValue}>
                    <ViewOptionsContext.Provider value={mockViewOptionsContextValue}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>{ui}</LocalizationProvider>
                    </ViewOptionsContext.Provider>
                </LoggableEventsContext.Provider>
            </MockedProvider>
        );
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders the add event button', () => {
        renderWithProvider(<CreateEventCard />);

        const addButton = screen.getByRole('button', { name: 'Add event' });
        expect(addButton).toBeInTheDocument();
        expect(addButton).toBeEnabled();
    });

    it('toggles between card and form views', async () => {
        renderWithProvider(<CreateEventCard />);

        // Initial state - card view
        expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();

        // Click to show form
        const addButton = screen.getByRole('button', { name: 'Add event' });
        await userEvent.click(addButton);

        // Form view
        expect(screen.queryByRole('button', { name: 'Add event' })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Event name')).toBeInTheDocument();

        // Cancel to return to card view
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        await userEvent.click(cancelButton);

        // Back to card view
        expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();
    });
});
