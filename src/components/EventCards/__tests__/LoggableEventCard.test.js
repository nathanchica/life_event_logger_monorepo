import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parseISO } from 'date-fns';

import { useLoggableEvents } from '../../../hooks/useLoggableEvents';
import { createMockEventLabelFragment } from '../../../mocks/eventLabels';
import { createMockLoggableEventFragment } from '../../../mocks/loggableEvent';
import LoggableEventCard from '../LoggableEventCard';

jest.mock('../../../hooks/useLoggableEvents');
jest.mock('../EditEventCard', () => {
    return function MockEditEventCard({ onDismiss }) {
        return (
            <form role="form" aria-label="Edit event">
                <input aria-label="Event name" defaultValue="Exercise" />
                <button type="button" onClick={onDismiss}>
                    Cancel
                </button>
            </form>
        );
    };
});

describe('LoggableEventCard', () => {
    let apolloCache;
    let user;
    const mockAddTimestampToEvent = jest.fn();
    const mockDeleteLoggableEvent = jest.fn();

    const mockEventLabels = [
        createMockEventLabelFragment({ id: 'health-label', name: 'Health' }),
        createMockEventLabelFragment({ id: 'personal-label', name: 'Personal' }),
        createMockEventLabelFragment({ id: 'work-label', name: 'Work' })
    ];

    const mockEvent = createMockLoggableEventFragment({
        id: 'event-1',
        name: 'Exercise',
        timestamps: ['2025-01-10T10:00:00Z'], // Same day as the fixed test date
        labels: [mockEventLabels[0], mockEventLabels[1]]
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(parseISO('2025-01-10')); // Set a fixed date for testing
        user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        useLoggableEvents.mockReturnValue({
            addTimestampToEvent: mockAddTimestampToEvent,
            deleteLoggableEvent: mockDeleteLoggableEvent
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
        if (apolloCache) {
            apolloCache.reset();
        }
    });

    const renderWithProviders = (options = {}) => {
        const { eventData = mockEvent, theme = 'light', skipCachePrepopulation = false } = options;

        apolloCache = new InMemoryCache();

        if (!skipCachePrepopulation && eventData) {
            apolloCache.writeFragment({
                id: `LoggableEvent:${eventData.id}`,
                fragment: LoggableEventCard.fragments.loggableEvent,
                data: eventData
            });
        }

        const muiTheme = createTheme({
            palette: {
                mode: theme
            }
        });

        return render(
            <MockedProvider mocks={[]} addTypename={false} cache={apolloCache}>
                <ThemeProvider theme={muiTheme}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <LoggableEventCard eventId="event-1" />
                    </LocalizationProvider>
                </ThemeProvider>
            </MockedProvider>
        );
    };

    it('should display event information and labels', () => {
        renderWithProviders();

        expect(screen.getByText('Exercise')).toBeInTheDocument();
        expect(screen.getByText('Log Today')).toBeInTheDocument();
        expect(screen.getByText('Log custom date')).toBeInTheDocument();
        expect(screen.getByText('Health')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
        expect(screen.queryByText('Work')).not.toBeInTheDocument();
        expect(screen.getByText('Records')).toBeInTheDocument();
    });

    it('should handle empty states', () => {
        const emptyEvent = createMockLoggableEventFragment({
            id: 'event-1',
            name: 'Exercise',
            timestamps: [],
            labels: []
        });

        renderWithProviders({
            eventData: emptyEvent
        });

        expect(screen.queryByText('Health')).not.toBeInTheDocument();
        expect(screen.queryByText('Personal')).not.toBeInTheDocument();
        expect(screen.queryByText('Records')).not.toBeInTheDocument();
    });

    it('should show limited records message for many timestamps', () => {
        const manyTimestamps = [
            '2025-01-10T10:00:00Z', // Fixed test date
            '2025-01-09T10:00:00Z', // 1 day ago
            '2025-01-08T10:00:00Z', // 2 days ago
            '2025-01-07T10:00:00Z', // 3 days ago
            '2025-01-06T10:00:00Z', // 4 days ago
            '2025-01-05T10:00:00Z', // 5 days ago
            '2025-01-04T10:00:00Z', // 6 days ago
            '2025-01-03T10:00:00Z', // 7 days ago
            '2025-01-02T10:00:00Z', // 8 days ago
            '2025-01-01T10:00:00Z' // 9 days ago
        ];

        const eventWithManyTimestamps = createMockLoggableEventFragment({
            id: 'event-1',
            name: 'Exercise',
            timestamps: manyTimestamps,
            labels: mockEventLabels
        });

        renderWithProviders({
            eventData: eventWithManyTimestamps
        });

        expect(screen.getByText('Records (Up to 5 most recent)')).toBeInTheDocument();
    });

    it('should handle edit and delete actions', async () => {
        renderWithProviders();

        const optionsButton = screen.getByRole('button', { name: 'Event options for Exercise' });
        await user.click(optionsButton);

        const editMenuItem = screen.getByRole('menuitem', { name: 'Edit event' });
        await user.click(editMenuItem);

        // Check that we're in edit mode by looking for the form
        expect(screen.getByRole('form', { name: 'Edit event' })).toBeInTheDocument();
        expect(screen.getByLabelText('Event name')).toHaveValue('Exercise');
        expect(screen.queryByRole('heading', { name: 'Exercise' })).not.toBeInTheDocument();

        await user.click(screen.getByText('Cancel'));
        expect(screen.getByRole('heading', { name: 'Exercise' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Event options for Exercise' }));
        await user.click(screen.getByRole('menuitem', { name: 'Delete event' }));
        expect(mockDeleteLoggableEvent).toHaveBeenCalledWith({ input: { id: 'event-1' } });
    });

    it.each([
        ['2025-01-10T15:00:00Z', 'Last event: Today'], // Same day as last event
        ['2025-01-14T10:00:00Z', 'Last event: 4 days ago'], // 4 days after last event
        ['2025-01-20T10:00:00Z', 'Last event: 10 days ago'] // 10 days after last event
    ])('should display last event information based on time elapsed (%s)', (dateString, expectedText) => {
        jest.setSystemTime(new Date(dateString));
        renderWithProviders();
        expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('should render null when skipCachePrepopulation is true and no data is available', () => {
        const { container } = renderWithProviders({ skipCachePrepopulation: true });
        expect(container.firstChild).toBeNull();
    });

    it('should show records but not LastEventDisplay when only future timestamps exist', () => {
        const futureEvent = createMockLoggableEventFragment({
            id: 'event-1',
            name: 'Exercise',
            timestamps: ['2025-01-15T10:00:00Z'], // 5 days in the future from test date (2025-01-10)
            labels: [mockEventLabels[0]]
        });

        renderWithProviders({ eventData: futureEvent });

        expect(screen.getByText('Exercise')).toBeInTheDocument();
        expect(screen.getByText('Records')).toBeInTheDocument();
        expect(screen.queryByText(/Last event:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/days ago/)).not.toBeInTheDocument();
    });
});
