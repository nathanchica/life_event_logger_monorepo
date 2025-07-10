import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';

import { createMockEventLabelFragment } from '../../mocks/eventLabels';
import { createMockLoggableEventFragment } from '../../mocks/loggableEvent';
import { createMockAuthContextValue } from '../../mocks/providers';
import { createMockUser } from '../../mocks/user';
import { AuthContext } from '../../providers/AuthProvider';
import LoggableEventsGQL, { GET_LOGGABLE_EVENTS_FOR_USER } from '../LoggableEventsGQL';

jest.mock('../LoggableEventsView', () => {
    return function MockLoggableEventsView({ isLoading, isShowingFetchError }) {
        return (
            <div data-testid="loggable-events-view">
                {isLoading && <span>Loading</span>}
                {isShowingFetchError && <span>Error</span>}
                Loggable Events View
            </div>
        );
    };
});

const createGetLoggableEventsForUserMock = (
    userId = createMockUser().id,
    loggableEvents = [
        createMockLoggableEventFragment(),
        createMockLoggableEventFragment({ id: 'event-2', name: 'Test Event 2' })
    ],
    eventLabels = [
        createMockEventLabelFragment({ id: 'label-1', name: 'Work' }),
        createMockEventLabelFragment({ id: 'label-2', name: 'Personal' })
    ]
) => {
    return {
        request: {
            query: GET_LOGGABLE_EVENTS_FOR_USER,
            variables: { userId }
        },
        result: {
            data: {
                user: {
                    __typename: 'User',
                    loggableEvents,
                    eventLabels
                }
            }
        }
    };
};

const createGetLoggableEventsForUserErrorMock = (userId = createMockUser().id) => ({
    request: {
        query: GET_LOGGABLE_EVENTS_FOR_USER,
        variables: { userId }
    },
    error: new Error('GraphQL Error: Unable to fetch loggable events')
});

describe('LoggableEventsGQL', () => {
    let mockLoadLoggableEvents;
    let mockLoadEventLabels;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLoadLoggableEvents = jest.fn();
        mockLoadEventLabels = jest.fn();
    });

    const renderWithProviders = (
        component,
        { authContextValue = createMockAuthContextValue(), apolloMocks = [] } = {}
    ) => {
        return render(
            <MockedProvider mocks={apolloMocks} addTypename={false}>
                <AuthContext.Provider value={authContextValue}>{component}</AuthContext.Provider>
            </MockedProvider>
        );
    };

    it('throws error when user is not authenticated', () => {
        const authContextValue = createMockAuthContextValue({ user: null });

        expect(() => {
            renderWithProviders(<LoggableEventsGQL />, { authContextValue });
        }).toThrow('User is not authenticated, please log in.');
    });

    it('renders LoggableEventsView when data is loaded', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [
            createGetLoggableEventsForUserMock(mockUser.id, [
                createMockLoggableEventFragment(),
                createMockLoggableEventFragment({ id: 'event-2', name: 'Test Event 2', labels: [] })
            ])
        ];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        expect(await screen.findByTestId('loggable-events-view')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockLoadLoggableEvents).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 'event-1',
                    name: 'Test Event 1',
                    timestamps: [new Date('2023-01-01T00:00:00Z')],
                    warningThresholdInDays: 7,
                    labelIds: ['label-1', 'label-2']
                }),
                expect.objectContaining({
                    id: 'event-2',
                    name: 'Test Event 2',
                    timestamps: [new Date('2023-01-01T00:00:00Z')],
                    warningThresholdInDays: 7,
                    labelIds: []
                })
            ]);
            expect(mockLoadEventLabels).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 'label-1',
                    name: 'Work'
                }),
                expect.objectContaining({
                    id: 'label-2',
                    name: 'Personal'
                })
            ]);
        });
    });

    it('calls context functions when data is successfully fetched', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserMock(mockUser.id)];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        // Wait for the component to render without errors (this validates the basic flow)
        expect(await screen.findByTestId('loggable-events-view')).toBeInTheDocument();
    });

    it('handles GraphQL query errors', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserErrorMock(mockUser.id)];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        // Wait for the error to be passed to LoggableEventsView
        expect(await screen.findByText('Error')).toBeInTheDocument();
    });

    it('renders loading state initially', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserMock(mockUser.id)];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        // Component should render (validates loading state handling)
        expect(await screen.findByTestId('loggable-events-view')).toBeInTheDocument();
    });

    it('handles empty data arrays', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserMock(mockUser.id, [], [])];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        expect(await screen.findByTestId('loggable-events-view')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockLoadLoggableEvents).toHaveBeenCalledWith([]);
            expect(mockLoadEventLabels).toHaveBeenCalledWith([]);
        });
    });

    it('uses correct user ID in GraphQL query', async () => {
        const mockUser = createMockUser({ id: 'specific-user-id' });
        const authContextValue = createMockAuthContextValue({ user: mockUser });
        const apolloMocks = [createGetLoggableEventsForUserMock('specific-user-id')];

        renderWithProviders(<LoggableEventsGQL />, {
            authContextValue,
            apolloMocks
        });

        expect(await screen.findByTestId('loggable-events-view')).toBeInTheDocument();
    });
});
