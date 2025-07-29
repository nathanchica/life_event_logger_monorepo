import { InMemoryCache, gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useLoggableEvents } from '../../../hooks/useLoggableEvents';
import { createMockEventLabelFragment } from '../../../mocks/eventLabels';
import { createMockLoggableEventFragment } from '../../../mocks/loggableEvent';
import { createMockAuthContextValue, createMockViewOptionsContextValue } from '../../../mocks/providers';
import { createMockUserFragment } from '../../../mocks/user';
import { AuthContext } from '../../../providers/AuthProvider';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import { MAX_EVENT_NAME_LENGTH } from '../../../utils/validation';
import EditEventCard from '../EditEventCard';

jest.mock('../../../hooks/useLoggableEvents');

describe('EditEventCard', () => {
    let apolloCache = new InMemoryCache();
    let mockUserFragment;
    let user;
    const mockOnDismiss = jest.fn();
    const mockCreateLoggableEvent = jest.fn();
    const mockUpdateLoggableEvent = jest.fn();

    const mockEventLabels = [
        createMockEventLabelFragment({ id: 'label-1', name: 'Work' }),
        createMockEventLabelFragment({ id: 'label-2', name: 'Personal' }),
        createMockEventLabelFragment({ id: 'label-3', name: 'Travel' })
    ];

    const mockEvent = createMockLoggableEventFragment({
        id: 'event-1',
        name: 'Existing Event',
        warningThresholdInDays: 14,
        labels: [mockEventLabels[0]]
    });

    const GET_USER_EVENTS_AND_LABELS = gql`
        query UserEventsAndLabels {
            loggedInUser {
                id
                ...UserLabelsAndEventsFragment
                loggableEvents {
                    ...EditEventCardFragment
                }
            }
        }
        ${EditEventCard.fragments.userLabelsAndEvents}
        ${EditEventCard.fragments.loggableEvent}
    `;

    beforeEach(() => {
        user = userEvent.setup();
        mockUserFragment = createMockUserFragment();
        useLoggableEvents.mockReturnValue({
            createLoggableEvent: mockCreateLoggableEvent,
            updateLoggableEvent: mockUpdateLoggableEvent
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        apolloCache.reset();
    });

    const renderWithProviders = (component, options = {}) => {
        const {
            activeEventLabelId = null,
            theme = 'light',
            mocks = [],
            startingEventLabels = mockEventLabels,
            startingLoggableEvents = [mockEvent],
            skipCachePrepopulation = false
        } = options;

        apolloCache = new InMemoryCache();

        if (!skipCachePrepopulation) {
            // Write the query data to make user fragment available
            apolloCache.writeQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                data: {
                    loggedInUser: {
                        __typename: 'User',
                        id: mockUserFragment.id,
                        loggableEvents: startingLoggableEvents,
                        eventLabels: startingEventLabels
                    }
                }
            });
        }

        const mockAuthValue = createMockAuthContextValue({
            user: { id: mockUserFragment.id, email: mockUserFragment.email, name: mockUserFragment.name }
        });
        const mockViewOptionsValue = createMockViewOptionsContextValue({
            activeEventLabelId,
            theme
        });

        const muiTheme = createTheme({
            palette: {
                mode: theme
            }
        });

        return render(
            <MockedProvider mocks={mocks} addTypename={false} cache={apolloCache}>
                <ThemeProvider theme={muiTheme}>
                    <AuthContext.Provider value={mockAuthValue}>
                        <ViewOptionsContext.Provider value={mockViewOptionsValue}>
                            {component}
                        </ViewOptionsContext.Provider>
                    </AuthContext.Provider>
                </ThemeProvider>
            </MockedProvider>
        );
    };

    describe('Rendering', () => {
        it.each([
            ['light', 'light'],
            ['dark', 'dark']
        ])('renders form with correct elements and theme styling in %s mode', (_, themeMode) => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />, { theme: themeMode });

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
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit={eventIdToEdit} />);
            expect(screen.getByRole('button', { name: expectedButtonText })).toBeInTheDocument();
        });
    });

    describe('Event name validation', () => {
        it.each([
            ['too long', 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1), 'Event name is too long', null],
            ['duplicate', 'Existing Event', 'That event name already exists', mockEvent]
        ])('shows error and disables button for name %s', async (_, inputValue, expectedError, existingEvent) => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />, {
                startingLoggableEvents: existingEvent ? [existingEvent] : []
            });

            const input = screen.getByLabelText('Event name');
            await user.type(input, inputValue);

            expect(screen.getByText(expectedError)).toBeInTheDocument();
            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeDisabled();
        });

        it('enables button when valid name is entered', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await user.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeEnabled();
        });
    });

    describe('Warning threshold', () => {
        it('shows/hides threshold form based on switch state', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            // Form should be hidden initially
            expect(screen.queryByLabelText('Warning threshold number')).not.toBeVisible();
            expect(screen.queryByLabelText('Warning threshold time unit')).not.toBeVisible();

            // Enable warning threshold
            const warningSwitch = screen.getByLabelText('Enable warning');
            await user.click(warningSwitch);

            // Form should now be visible
            expect(screen.getByLabelText('Warning threshold number')).toBeVisible();
            expect(screen.getByLabelText('Warning threshold time unit')).toBeVisible();
        });

        it('preserves existing warning threshold when editing event', () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />);

            // Warning should be enabled and form visible
            const warningSwitch = screen.getByLabelText('Enable warning');
            expect(warningSwitch).toBeChecked();
            expect(screen.getByLabelText('Warning threshold number')).toBeVisible();
        });

        it('handles warning threshold changes', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            // Enable warning threshold
            const warningSwitch = screen.getByLabelText('Enable warning');
            await user.click(warningSwitch);

            // Change the warning threshold value
            const numberInput = screen.getByLabelText('Warning threshold number');
            await user.clear(numberInput);
            await user.type(numberInput, '5');

            // Verify the value changed
            expect(numberInput).toHaveValue(5);
        });
    });

    describe('Labels', () => {
        it('shows label input when Add labels is clicked', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const addLabelsButton = screen.getByRole('button', { name: 'Add labels' });
            await user.click(addLabelsButton);

            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
        });

        it('pre-populates selected labels when creating new event with active label', () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />, {
                startingEventLabels: mockEventLabels,
                activeEventLabelId: mockEventLabels[0].id
            });

            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
            expect(screen.getByText(mockEventLabels[0].name)).toBeInTheDocument();
        });

        it('filters and pre-populates labels when editing event with existing labels', () => {
            const existingEvent = createMockLoggableEventFragment({
                ...mockEvent,
                labels: [mockEventLabels[0], mockEventLabels[1]]
            });

            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit={mockEvent.id} />, {
                startingLoggableEvents: [existingEvent],
                startingEventLabels: mockEventLabels
            });

            expect(screen.getByText(mockEventLabels[0].name)).toBeInTheDocument();
            expect(screen.getByText(mockEventLabels[1].name)).toBeInTheDocument();
            expect(screen.queryByText(mockEventLabels[2].name)).not.toBeInTheDocument();
        });

        it('handles event with no labelIds when editing', () => {
            const eventWithoutLabels = createMockLoggableEventFragment({
                id: 'event-1',
                name: 'Existing Event',
                timestamps: [],
                warningThresholdInDays: 14,
                labels: []
            });

            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                startingLoggableEvents: [eventWithoutLabels]
            });

            expect(screen.queryByText('Work')).not.toBeInTheDocument();
            expect(screen.queryByText('Personal')).not.toBeInTheDocument();
        });
    });

    describe('Form submission', () => {
        it('dismisses form when Cancel button is clicked', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const cancelButton = screen.getByRole('button', { name: /Cancel/i });
            await user.click(cancelButton);

            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('creates event and dismisses form when Create button is clicked with valid name', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await user.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            await user.click(createButton);

            expect(mockCreateLoggableEvent).toHaveBeenCalledWith({
                input: {
                    name: 'Test Event',
                    warningThresholdInDays: 0,
                    labelIds: []
                }
            });
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('creates event and dismisses form when Enter key is pressed with valid name', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await user.type(input, 'Test Event{enter}');

            expect(mockCreateLoggableEvent).toHaveBeenCalledWith({
                input: {
                    name: 'Test Event',
                    warningThresholdInDays: 0,
                    labelIds: []
                }
            });
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('creates event with selected labels', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />, {
                activeEventLabelId: 'label-1'
            });

            const input = screen.getByLabelText('Event name');
            await user.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            await user.click(createButton);

            expect(mockCreateLoggableEvent).toHaveBeenCalledWith({
                input: {
                    name: 'Test Event',
                    warningThresholdInDays: 0,
                    labelIds: ['label-1']
                }
            });
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('does not create event when Enter is pressed with invalid name', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await user.type(input, 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1));
            await user.type(input, '{enter}');

            expect(mockOnDismiss).not.toHaveBeenCalled();
            expect(mockCreateLoggableEvent).not.toHaveBeenCalled();
        });
    });

    describe('Edit mode', () => {
        it('updates existing event with labels', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />);

            const input = screen.getByLabelText('Event name');
            await user.clear(input);
            await user.type(input, 'Updated Event Name');

            const updateButton = screen.getByRole('button', { name: 'Update' });
            await user.click(updateButton);

            expect(mockUpdateLoggableEvent).toHaveBeenCalledWith({
                input: {
                    id: 'event-1',
                    name: 'Updated Event Name',
                    warningThresholdInDays: 14,
                    labelIds: ['label-1']
                }
            });
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('only updates event when event name is valid', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />);

            const input = screen.getByLabelText('Event name');
            const updateButton = screen.getByRole('button', { name: 'Update' });

            await user.clear(input);
            expect(updateButton).toBeDisabled();

            await user.type(input, 'Valid Event Name');
            expect(updateButton).toBeEnabled();

            await user.click(updateButton);
            expect(mockUpdateLoggableEvent).toHaveBeenCalledTimes(1);
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('does not update event when Enter is pressed with invalid name', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />);

            const input = screen.getByLabelText('Event name');
            await user.clear(input);
            await user.type(input, '{enter}');

            expect(mockOnDismiss).not.toHaveBeenCalled();
            expect(mockUpdateLoggableEvent).not.toHaveBeenCalled();
        });
    });
});
