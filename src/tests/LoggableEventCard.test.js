import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import LoggableEventCard from '../components/EventCards/LoggableEventCard';
import { LoggableEventsContext } from '../providers/LoggableEventsProvider';
import { ViewOptionsContext } from '../providers/ComponentDisplayProvider';

describe('LoggableEventCard', () => {
    const mockEventLabels = [
        { id: 'label-1', name: 'Work' },
        { id: 'label-2', name: 'Personal' }
    ];

    const mockEvent = {
        id: 'event-1',
        name: 'Test Event',
        timestamps: [new Date('2023-01-15'), new Date('2023-01-10'), new Date('2023-01-05')],
        warningThresholdInDays: 7,
        labelIds: ['label-1']
    };

    const mockAddTimestampToEvent = jest.fn();
    const mockRemoveLoggableEvent = jest.fn();

    function renderWithProvider(ui, options = {}) {
        const { loggableEvents = [mockEvent], eventLabels = mockEventLabels, activeEventLabelId = null } = options;

        const mockLoggableEventsContextValue = {
            loggableEvents,
            createLoggableEvent: jest.fn(),
            updateLoggableEventDetails: jest.fn(),
            deleteLoggableEvent: jest.fn(),
            logEvent: jest.fn(),
            deleteEventTimestamp: jest.fn(),
            addTimestampToEvent: mockAddTimestampToEvent,
            removeLoggableEvent: mockRemoveLoggableEvent,
            eventLabels,
            createEventLabel: jest.fn(),
            deleteEventLabel: jest.fn(),
            offlineMode: true
        };

        const mockViewOptionsContextValue = {
            activeEventLabelId: activeEventLabelId,
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

    describe('Rendering', () => {
        it.each([
            ['light', 'light'],
            ['dark', 'dark']
        ])('renders card with correct elements in %s mode', (_, themeMode) => {
            const theme = createTheme({
                palette: {
                    mode: themeMode
                }
            });

            renderWithProvider(
                <ThemeProvider theme={theme}>
                    <LoggableEventCard eventId="event-1" />
                </ThemeProvider>
            );

            expect(screen.getByText('Test Event')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Log Today' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Log custom date' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Event options for Test Event' })).toBeInTheDocument();
        });

        it('renders correctly with labels', () => {
            const eventWithLabels = { ...mockEvent, labelIds: ['label-1'] };
            renderWithProvider(<LoggableEventCard eventId="event-1" />, {
                loggableEvents: [eventWithLabels]
            });

            expect(screen.getByText('Work')).toBeInTheDocument();
        });

        it('renders correctly without labels', () => {
            const eventWithoutLabels = { ...mockEvent, labelIds: null };
            renderWithProvider(<LoggableEventCard eventId="event-1" />, {
                loggableEvents: [eventWithoutLabels]
            });

            expect(screen.queryByText('Work')).not.toBeInTheDocument();
        });

        it('displays truncation message for 5+ records', () => {
            const eventWithManyRecords = {
                ...mockEvent,
                timestamps: [
                    new Date('2023-01-20'),
                    new Date('2023-01-19'),
                    new Date('2023-01-18'),
                    new Date('2023-01-17'),
                    new Date('2023-01-16'),
                    new Date('2023-01-15')
                ]
            };
            renderWithProvider(<LoggableEventCard eventId="event-1" />, {
                loggableEvents: [eventWithManyRecords]
            });

            expect(screen.getByText('Records (Up to 5 most recent)')).toBeInTheDocument();
        });
    });

    describe('Last event display', () => {
        it.each([
            ['today', 0, 'Last event: Today'],
            ['yesterday', 1, 'Last event: Yesterday'],
            ['multiple days ago', 10, 'Last event: 10 days ago'],
            ['1 month ago', 35, 'Last event: 1 month ago'],
            ['multiple months ago', 75, 'Last event: 2 months ago'],
            ['1 year ago', 400, 'Last event: 1 year ago'],
            ['multiple years ago', 800, 'Last event: 2 years ago']
        ])('shows correct text when last event was %s', (_, daysAgo, expectedText) => {
            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() - daysAgo);
            const eventWithTimestamp = {
                ...mockEvent,
                timestamps: [eventDate],
                warningThresholdInDays: daysAgo >= 7 ? 7 : 0
            };
            renderWithProvider(<LoggableEventCard eventId="event-1" />, {
                loggableEvents: [eventWithTimestamp]
            });

            expect(screen.getByText(expectedText)).toBeInTheDocument();
        });
    });

    describe('Log Today button', () => {
        it('is enabled when last event was not today', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const eventWithYesterdayRecord = {
                ...mockEvent,
                timestamps: [yesterday]
            };
            renderWithProvider(<LoggableEventCard eventId="event-1" />, {
                loggableEvents: [eventWithYesterdayRecord]
            });

            const logTodayButton = screen.getByRole('button', { name: 'Log Today' });
            expect(logTodayButton).toBeEnabled();
        });

        it('is disabled when last event was today', () => {
            const today = new Date();
            const eventWithTodayRecord = {
                ...mockEvent,
                timestamps: [today]
            };
            renderWithProvider(<LoggableEventCard eventId="event-1" />, {
                loggableEvents: [eventWithTodayRecord]
            });

            const logTodayButton = screen.getByRole('button', { name: 'Log Today' });
            expect(logTodayButton).toBeDisabled();
        });

        it('calls addTimestampToEvent when clicked', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const eventWithYesterdayRecord = {
                ...mockEvent,
                timestamps: [yesterday]
            };
            renderWithProvider(<LoggableEventCard eventId="event-1" />, {
                loggableEvents: [eventWithYesterdayRecord]
            });

            const logTodayButton = screen.getByRole('button', { name: 'Log Today' });
            await userEvent.click(logTodayButton);

            expect(mockAddTimestampToEvent).toHaveBeenCalledWith('event-1', expect.any(Date));
        });
    });

    describe('Log custom date', () => {
        it('shows date picker when "Log custom date" is clicked', async () => {
            renderWithProvider(<LoggableEventCard eventId="event-1" />);

            const logCustomDateButton = screen.getByRole('button', { name: 'Log custom date' });
            await userEvent.click(logCustomDateButton);

            expect(screen.getByLabelText('Event date')).toBeInTheDocument();
            expect(screen.getByText('Pick a date to log an event for')).toBeInTheDocument();
        });

        it('hides date picker when cancel button is clicked', async () => {
            renderWithProvider(<LoggableEventCard eventId="event-1" />);

            const logCustomDateButton = screen.getByRole('button', { name: 'Log custom date' });
            await userEvent.click(logCustomDateButton);

            const datePicker = screen.getByLabelText('Event date');
            expect(datePicker).toBeVisible();

            const cancelIcon = screen.getByTestId('CancelIcon');
            await userEvent.click(cancelIcon.closest('button'));

            await waitFor(() => {
                expect(datePicker).not.toBeVisible();
            });
        });

        it('calls addTimestampToEvent when date is selected from picker', async () => {
            renderWithProvider(<LoggableEventCard eventId="event-1" />);

            const logCustomDateButton = screen.getByRole('button', { name: 'Log custom date' });
            await userEvent.click(logCustomDateButton);

            const datePicker = screen.getByLabelText('Event date');
            expect(datePicker).toBeVisible();

            // Simulate the date picker onChange and onAccept
            const dateInput = screen.getByLabelText('Choose date');
            await userEvent.click(dateInput);

            // Find and click the "OK" button to trigger onAccept
            const okButton = screen.getByRole('button', { name: 'OK' });
            await userEvent.click(okButton);

            await waitFor(() => {
                expect(mockAddTimestampToEvent).toHaveBeenCalledWith('event-1', expect.any(Date));
            });
        });
    });

    describe('Event options dropdown', () => {
        it('shows options dropdown when event options button is clicked', async () => {
            renderWithProvider(<LoggableEventCard eventId="event-1" />);

            const moreOptionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });
            await userEvent.click(moreOptionsButton);

            expect(screen.getByText('Edit event')).toBeInTheDocument();
            expect(screen.getByText('Delete event')).toBeInTheDocument();
        });

        it('calls removeLoggableEvent when delete is clicked', async () => {
            renderWithProvider(<LoggableEventCard eventId="event-1" />);

            const moreOptionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });
            await userEvent.click(moreOptionsButton);

            const deleteButton = screen.getByText('Delete event');
            await userEvent.click(deleteButton);

            expect(mockRemoveLoggableEvent).toHaveBeenCalledWith('event-1');
        });

        it('shows edit form when edit is clicked', async () => {
            renderWithProvider(<LoggableEventCard eventId="event-1" />);

            const moreOptionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });
            await userEvent.click(moreOptionsButton);

            const editButton = screen.getByText('Edit event');
            await userEvent.click(editButton);

            expect(screen.getByLabelText('Event name')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
        });

        it('returns to card view when edit form is cancelled', async () => {
            renderWithProvider(<LoggableEventCard eventId="event-1" />);

            const moreOptionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });
            await userEvent.click(moreOptionsButton);

            const editButton = screen.getByText('Edit event');
            await userEvent.click(editButton);

            expect(screen.getByLabelText('Event name')).toBeInTheDocument();

            const cancelButton = screen.getByRole('button', { name: /Cancel/i });
            await userEvent.click(cancelButton);

            expect(screen.getByText('Test Event')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Log Today' })).toBeInTheDocument();
        });
    });

    describe('Loading states', () => {
        it('shows loading state when submitting', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const eventWithYesterdayRecord = {
                ...mockEvent,
                timestamps: [yesterday]
            };

            mockAddTimestampToEvent.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

            renderWithProvider(<LoggableEventCard eventId="event-1" />, {
                loggableEvents: [eventWithYesterdayRecord]
            });

            const logTodayButton = screen.getByRole('button', { name: 'Log Today' });
            await userEvent.click(logTodayButton);

            await waitFor(() => {
                expect(logTodayButton).toBeDisabled();
                expect(screen.getByRole('progressbar')).toBeInTheDocument();
            });
        });
    });
});
