import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import EditEventCard, { MAX_LENGTH } from '../components/EventCards/EditEventCard';
import { LoggableEventsContext } from '../providers/LoggableEventsProvider';
import { ViewOptionsContext } from '../providers/ComponentDisplayProvider';

describe('EditEventCard', () => {
    // Default test data
    const mockEventLabels = [
        { id: 'label-1', name: 'Work' },
        { id: 'label-2', name: 'Personal' }
    ];

    const mockEvent = {
        id: 'event-1',
        name: 'Existing Event',
        timestamps: [],
        warningThresholdInDays: 14,
        labelIds: ['label-1']
    };

    const mockOnDismiss = jest.fn();
    const mockCreateLoggableEvent = jest.fn();
    const mockUpdateLoggableEventDetails = jest.fn();

    function renderWithProvider(ui, options = {}) {
        const { existingEvents = [], eventLabels = [], activeEventLabelId = null } = options;

        const mockLoggableEventsContextValue = {
            loggableEvents: existingEvents,
            createLoggableEvent: mockCreateLoggableEvent,
            updateLoggableEventDetails: mockUpdateLoggableEventDetails,
            deleteLoggableEvent: jest.fn(),
            logEvent: jest.fn(),
            deleteEventTimestamp: jest.fn(),
            eventLabels: eventLabels,
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
                    <ViewOptionsContext.Provider value={mockViewOptionsContextValue}>{ui}</ViewOptionsContext.Provider>
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
        ])('renders form with correct elements and theme styling in %s mode', (_, themeMode) => {
            const theme = createTheme({
                palette: {
                    mode: themeMode
                }
            });

            renderWithProvider(
                <ThemeProvider theme={theme}>
                    <EditEventCard onDismiss={mockOnDismiss} />
                </ThemeProvider>
            );

            expect(screen.getByLabelText('Event name')).toBeInTheDocument();
            expect(screen.getByLabelText('Enable warning')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Add labels' })).toBeInTheDocument();

            const createButton = screen.getByRole('button', { name: 'Create' });
            const cancelButton = screen.getByRole('button', { name: /Cancel/i });

            expect(createButton).toBeInTheDocument();
            expect(createButton).toBeDisabled();
            expect(cancelButton).toBeInTheDocument();
        });

        it.each([
            ['Create mode', null, 'Create'],
            ['Edit mode', 'event-1', 'Update']
        ])('renders correct button in %s', (_, eventIdToEdit, expectedButtonText) => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit={eventIdToEdit} />);
            expect(screen.getByRole('button', { name: expectedButtonText })).toBeInTheDocument();
        });
    });

    describe('Event name validation', () => {
        it.each([
            ['too long', 'a'.repeat(MAX_LENGTH + 1), 'Event name is too long', null],
            ['duplicate', 'Existing Event', 'That event name already exists', mockEvent]
        ])('shows error and disables button for name %s', async (_, inputValue, expectedError, existingEvent) => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />, {
                existingEvents: existingEvent ? [existingEvent] : []
            });

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, inputValue);

            expect(screen.getByText(expectedError)).toBeInTheDocument();
            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeDisabled();
        });

        it('enables button when valid name is entered', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeEnabled();
        });
    });

    describe('Warning threshold', () => {
        it('shows/hides threshold form based on switch state', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            // Form should be hidden initially
            expect(screen.queryByLabelText('Warning threshold number')).not.toBeVisible();
            expect(screen.queryByLabelText('Warning threshold time unit')).not.toBeVisible();

            // Enable warning threshold
            const warningSwitch = screen.getByLabelText('Enable warning');
            await userEvent.click(warningSwitch);

            // Form should now be visible
            expect(screen.getByLabelText('Warning threshold number')).toBeVisible();
            expect(screen.getByLabelText('Warning threshold time unit')).toBeVisible();
        });

        it('preserves existing warning threshold when editing event', () => {
            const eventWithWarning = {
                ...mockEvent,
                warningThresholdInDays: 30
            };

            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [eventWithWarning]
            });

            // Warning should be enabled and form visible
            const warningSwitch = screen.getByLabelText('Enable warning');
            expect(warningSwitch).toBeChecked();
            expect(screen.getByLabelText('Warning threshold number')).toBeVisible();
        });

        it('handles warning threshold changes', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            // Enable warning threshold
            const warningSwitch = screen.getByLabelText('Enable warning');
            await userEvent.click(warningSwitch);

            // Change the warning threshold value
            const numberInput = screen.getByLabelText('Warning threshold number');
            await userEvent.clear(numberInput);
            await userEvent.type(numberInput, '5');

            // Verify the value changed (this triggers handleWarningThresholdChange)
            expect(numberInput).toHaveValue(5);
        });
    });

    describe('Labels', () => {
        it('shows label input when Add labels is clicked', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const addLabelsButton = screen.getByRole('button', { name: 'Add labels' });
            await userEvent.click(addLabelsButton);

            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
        });

        it('pre-populates selected labels when creating new event with active label', () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />, {
                eventLabels: mockEventLabels,
                activeEventLabelId: 'label-1'
            });

            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
            expect(screen.getByText('Work')).toBeInTheDocument();
        });

        it('filters and pre-populates labels when editing event with existing labels', () => {
            const existingEvent = {
                ...mockEvent,
                labelIds: ['label-1']
            };

            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [existingEvent],
                eventLabels: mockEventLabels
            });

            expect(screen.getByText('Work')).toBeInTheDocument();
            expect(screen.queryByText('Personal')).not.toBeInTheDocument();
        });

        it('handles event with no labelIds when editing', () => {
            const existingEvent = {
                ...mockEvent,
                labelIds: null
            };

            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [existingEvent],
                eventLabels: mockEventLabels
            });

            expect(screen.queryByText('Work')).not.toBeInTheDocument();
            expect(screen.queryByText('Personal')).not.toBeInTheDocument();
        });
    });

    describe('Form submission', () => {
        it.each([
            [
                'Cancel button',
                async () => {
                    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
                    await userEvent.click(cancelButton);
                },
                null
            ],
            [
                'Create button with valid name',
                async () => {
                    const input = screen.getByLabelText('Event name');
                    await userEvent.type(input, 'Test Event');
                    const createButton = screen.getByRole('button', { name: 'Create' });
                    await userEvent.click(createButton);
                },
                null
            ],
            [
                'Enter key with valid name',
                async () => {
                    const input = screen.getByLabelText('Event name');
                    await userEvent.type(input, 'Test Event{enter}');
                },
                null
            ],
            [
                'Create with selected labels',
                async () => {
                    const input = screen.getByLabelText('Event name');
                    await userEvent.type(input, 'Test Event');
                    const createButton = screen.getByRole('button', { name: 'Create' });
                    await userEvent.click(createButton);
                },
                'label-1'
            ]
        ])('dismisses form when %s is used', async (_, action, activeLabel) => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />, {
                eventLabels: activeLabel ? mockEventLabels : [],
                activeEventLabelId: activeLabel
            });

            await action();
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('does not create event when Enter is pressed with invalid name', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, '{enter}');

            expect(mockOnDismiss).not.toHaveBeenCalled();
            expect(mockCreateLoggableEvent).not.toHaveBeenCalled();
        });
    });

    describe('Edit mode', () => {
        it('updates existing event with labels', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [mockEvent],
                eventLabels: mockEventLabels
            });

            const input = screen.getByLabelText('Event name');
            expect(input.value).toBe('Existing Event');
            expect(screen.getByText('Work')).toBeInTheDocument();

            await userEvent.clear(input);
            await userEvent.type(input, 'Updated Event Name');

            const updateButton = screen.getByRole('button', { name: 'Update' });
            await userEvent.click(updateButton);

            expect(mockUpdateLoggableEventDetails).toHaveBeenCalledTimes(1);
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('only updates event when event name is valid', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [{ ...mockEvent, labelIds: [] }]
            });

            const input = screen.getByLabelText('Event name');
            const updateButton = screen.getByRole('button', { name: 'Update' });

            await userEvent.clear(input);
            expect(updateButton).toBeDisabled();

            await userEvent.type(input, 'Valid Event Name');
            expect(updateButton).toBeEnabled();

            await userEvent.click(updateButton);
            expect(mockUpdateLoggableEventDetails).toHaveBeenCalledTimes(1);
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('does not update event when Enter is pressed with invalid name', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [{ ...mockEvent, labelIds: [] }]
            });

            const input = screen.getByLabelText('Event name');
            await userEvent.clear(input);
            await userEvent.type(input, '{enter}');

            expect(mockOnDismiss).not.toHaveBeenCalled();
            expect(mockUpdateLoggableEventDetails).not.toHaveBeenCalled();
        });
    });
});
