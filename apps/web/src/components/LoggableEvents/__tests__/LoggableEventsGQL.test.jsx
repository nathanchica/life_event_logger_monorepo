import { MockedProvider } from '@apollo/client/testing';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { createMockEventLabelFragment } from '../../../mocks/eventLabels';
import { createMockLoggableEventFragment } from '../../../mocks/loggableEvent';
import { createMockAuthContextValue, createMockViewOptionsContextValue } from '../../../mocks/providers';
import { createMockUser } from '../../../mocks/user';
import { AuthContext } from '../../../providers/AuthProvider';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import LoggableEventsGQL, { GET_LOGGABLE_EVENTS_FOR_USER } from '../LoggableEventsGQL';

const mockUser = createMockUser();

const createGetLoggableEventsForUserMock = ({
    loggableEvents = [
        createMockLoggableEventFragment(),
        createMockLoggableEventFragment({ id: 'event-2', name: 'Test Event 2' })
    ],
    eventLabels = [
        createMockEventLabelFragment({ id: 'label-1', name: 'Work' }),
        createMockEventLabelFragment({ id: 'label-2', name: 'Personal' })
    ]
} = {}) => {
    return {
        request: {
            query: GET_LOGGABLE_EVENTS_FOR_USER
        },
        result: {
            data: {
                loggedInUser: {
                    __typename: 'User',
                    id: mockUser.id,
                    loggableEvents,
                    eventLabels
                }
            }
        }
    };
};

const createGetLoggableEventsForUserErrorMock = () => ({
    request: {
        query: GET_LOGGABLE_EVENTS_FOR_USER
    },
    error: new Error('GraphQL Error: Unable to fetch loggable events')
});

describe('LoggableEventsGQL', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithProviders = (
        component,
        {
            authContextValue = createMockAuthContextValue({ user: mockUser }),
            viewOptionsContextValue = {},
            apolloMocks = []
        } = {}
    ) => {
        const defaultAuthContextValue = createMockAuthContextValue(authContextValue);
        const defaultViewOptionsValue = createMockViewOptionsContextValue(viewOptionsContextValue);
        return render(
            <MockedProvider mocks={apolloMocks}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <ViewOptionsContext.Provider value={defaultViewOptionsValue}>
                        <AuthContext.Provider value={defaultAuthContextValue}>{component}</AuthContext.Provider>
                    </ViewOptionsContext.Provider>
                </LocalizationProvider>
            </MockedProvider>
        );
    };

    it('renders loading state initially', async () => {
        const apolloMocks = [createGetLoggableEventsForUserMock()];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        expect(await screen.findAllByLabelText(/Loading event card/)).toHaveLength(3);
    });

    it('throws error when user is not authenticated', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const authContextValue = createMockAuthContextValue({ user: null });

        expect(() => {
            renderWithProviders(<LoggableEventsGQL />, { authContextValue });
        }).toThrow('Invariant failed: User is not authenticated');

        console.error.mockRestore();
    });

    it.each([
        ['offline mode', { isOfflineMode: true }],
        ['online mode', { isOfflineMode: false }]
    ])('renders LoggableEventsView in %s when data is loaded', async (_, authContextValue) => {
        const apolloMocks = [
            createGetLoggableEventsForUserMock({
                loggableEvents: [
                    createMockLoggableEventFragment(),
                    createMockLoggableEventFragment({ id: 'event-2', name: 'Test Event 2', labels: [] })
                ]
            })
        ];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks, authContextValue });

        expect(await screen.findByLabelText('Add event')).toBeInTheDocument();
    });

    it('handles GraphQL query errors', async () => {
        const apolloMocks = [createGetLoggableEventsForUserErrorMock()];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        expect(await screen.findByText(/Sorry, something went wrong/)).toBeInTheDocument();
    });

    it('handles empty data arrays', async () => {
        const apolloMocks = [
            createGetLoggableEventsForUserMock({
                loggableEvents: [],
                eventLabels: []
            })
        ];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        expect(await screen.findByLabelText('Add event')).toBeInTheDocument();
    });
});
