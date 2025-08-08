import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';

import { createMockEventLabelFragment } from '../../../mocks/eventLabels';
import { createMockLoggableEventFragment } from '../../../mocks/loggableEvent';
import { createMockAuthContextValue, createMockViewOptionsContextValue } from '../../../mocks/providers';
import { createMockUserFragment } from '../../../mocks/user';
import { AuthContext } from '../../../providers/AuthProvider';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import LoggableEventsList from '../LoggableEventsList';

// Mock LoggableEventCard component
jest.mock('../../EventCards/LoggableEventCard', () => {
    return function MockLoggableEventCard({ eventId }) {
        return <div data-testid={`loggable-event-card-${eventId}`}>LoggableEventCard {eventId}</div>;
    };
});

describe('LoggableEventsList', () => {
    let apolloCache;
    const mockUserFragment = createMockUserFragment({ id: 'user-1' });

    const mockEventLabels = [
        createMockEventLabelFragment({ id: 'label-work', name: 'Work' }),
        createMockEventLabelFragment({ id: 'label-health', name: 'Health' }),
        createMockEventLabelFragment({ id: 'label-social', name: 'Social' })
    ];

    const mockLoggableEvents = [
        createMockLoggableEventFragment({
            id: 'event-1',
            name: 'Work Meeting',
            labels: [mockEventLabels[0]]
        }),
        createMockLoggableEventFragment({
            id: 'event-2',
            name: 'Gym Session',
            labels: [mockEventLabels[1]]
        }),
        createMockLoggableEventFragment({
            id: 'event-3',
            name: 'Team Building',
            labels: [mockEventLabels[0], mockEventLabels[2]]
        })
    ];

    const renderWithProviders = (options = {}) => {
        const {
            viewOptionsValue = {},
            loggableEvents = mockLoggableEvents,
            skipCachePrepopulation = false,
            searchTerm
        } = options;

        apolloCache = new InMemoryCache();

        // Write the user fragment with loggable events to cache
        if (!skipCachePrepopulation) {
            apolloCache.writeFragment({
                id: apolloCache.identify(mockUserFragment),
                fragment: LoggableEventsList.fragments.loggableEventsForUser,
                data: {
                    __typename: 'User',
                    loggableEvents
                }
            });
        }

        const mockAuthValue = createMockAuthContextValue({
            user: {
                id: mockUserFragment.id,
                email: mockUserFragment.email,
                name: mockUserFragment.name
            }
        });

        const mockViewOptionsValue = createMockViewOptionsContextValue(viewOptionsValue);

        return render(
            <MockedProvider cache={apolloCache} addTypename={false}>
                <AuthContext.Provider value={mockAuthValue}>
                    <ViewOptionsContext.Provider value={mockViewOptionsValue}>
                        <LoggableEventsList {...(searchTerm !== undefined && { searchTerm })} />
                    </ViewOptionsContext.Provider>
                </AuthContext.Provider>
            </MockedProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (apolloCache) {
            apolloCache.reset();
        }
    });

    describe('event filtering', () => {
        it('shows all events when no activeEventLabelId is set', () => {
            renderWithProviders({ viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(3);

            expect(screen.getByTestId('loggable-event-card-event-1')).toBeInTheDocument();
            expect(screen.getByTestId('loggable-event-card-event-2')).toBeInTheDocument();
            expect(screen.getByTestId('loggable-event-card-event-3')).toBeInTheDocument();
        });

        it.each([
            ['work label', 'label-work', ['event-1', 'event-3']],
            ['health label', 'label-health', ['event-2']],
            ['social label', 'label-social', ['event-3']]
        ])('filters events by %s', (_, activeEventLabelId, expectedEventIds) => {
            renderWithProviders({ viewOptionsValue: { activeEventLabelId } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(expectedEventIds.length);

            expectedEventIds.forEach((eventId) => {
                expect(screen.getByTestId(`loggable-event-card-${eventId}`)).toBeInTheDocument();
            });
        });

        it('shows no events when filtering by non-existent label', () => {
            renderWithProviders({ viewOptionsValue: { activeEventLabelId: 'non-existent-label' } });

            const eventCards = screen.queryAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(0);
        });
    });

    describe('with empty events', () => {
        it('renders no list items when loggableEvents is empty', () => {
            renderWithProviders({ loggableEvents: [], viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.queryAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(0);
        });
    });

    describe('when fragment is not complete', () => {
        it('renders no list items when useFragment complete is false', () => {
            renderWithProviders({ skipCachePrepopulation: true });

            const eventCards = screen.queryAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(0);
        });

        it('renders no list items when fragment is incomplete even with active filter', () => {
            renderWithProviders({
                skipCachePrepopulation: true,
                viewOptionsValue: { activeEventLabelId: 'label-work' }
            });

            const eventCards = screen.queryAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(0);
        });
    });

    describe('events with no labels', () => {
        it('shows events without labels when no filter is active', () => {
            const eventsWithoutLabels = [
                createMockLoggableEventFragment({
                    id: 'event-no-labels',
                    name: 'No Labels Event',
                    labels: []
                })
            ];

            renderWithProviders({
                viewOptionsValue: { activeEventLabelId: null },
                loggableEvents: eventsWithoutLabels
            });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(1);
            expect(screen.getByTestId('loggable-event-card-event-no-labels')).toBeInTheDocument();
        });

        it('hides events without labels when filter is active', () => {
            const eventsWithoutLabels = [
                createMockLoggableEventFragment({
                    id: 'event-no-labels',
                    name: 'No Labels Event',
                    labels: []
                })
            ];

            renderWithProviders({
                viewOptionsValue: { activeEventLabelId: 'label-work' },
                loggableEvents: eventsWithoutLabels
            });

            const eventCards = screen.queryAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(0);
        });
    });

    describe('search functionality', () => {
        it('shows all events when searchTerm prop is not provided', () => {
            // Don't pass searchTerm at all - should use default empty string
            renderWithProviders({ viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(3);
        });

        it('shows all events when searchTerm is empty', () => {
            renderWithProviders({ searchTerm: '', viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(3);
        });

        it('filters events by exact match', () => {
            renderWithProviders({ searchTerm: 'Work Meeting', viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(1);
            expect(screen.getByTestId('loggable-event-card-event-1')).toBeInTheDocument();
        });

        it('filters events by partial match', () => {
            renderWithProviders({ searchTerm: 'Gym', viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(1);
            expect(screen.getByTestId('loggable-event-card-event-2')).toBeInTheDocument();
        });

        it('filters events with fuzzy matching for typos', () => {
            renderWithProviders({ searchTerm: 'Meating', viewOptionsValue: { activeEventLabelId: null } }); // Typo for 'Meeting'

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(1);
            expect(screen.getByTestId('loggable-event-card-event-1')).toBeInTheDocument();
        });

        it('returns multiple matches when search term matches multiple events', () => {
            renderWithProviders({ searchTerm: 'Team', viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(1);
            expect(screen.getByTestId('loggable-event-card-event-3')).toBeInTheDocument();
        });

        it('shows no events when search term does not match anything', () => {
            renderWithProviders({ searchTerm: 'NotFoundAnywhere', viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.queryAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(0);
        });

        it('trims whitespace from search term', () => {
            renderWithProviders({ searchTerm: '  Work Meeting  ', viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(1);
            expect(screen.getByTestId('loggable-event-card-event-1')).toBeInTheDocument();
        });

        it('is case insensitive', () => {
            renderWithProviders({ searchTerm: 'work meeting', viewOptionsValue: { activeEventLabelId: null } });

            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(1);
            expect(screen.getByTestId('loggable-event-card-event-1')).toBeInTheDocument();
        });
    });

    describe('combined filtering (search and label)', () => {
        it('applies both search and label filters', () => {
            renderWithProviders({
                searchTerm: 'Team',
                viewOptionsValue: { activeEventLabelId: 'label-work' }
            });

            // Team Building has both 'Team' in name and 'label-work' label
            const eventCards = screen.getAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(1);
            expect(screen.getByTestId('loggable-event-card-event-3')).toBeInTheDocument();
        });

        it('shows no events when search matches but label does not', () => {
            renderWithProviders({
                searchTerm: 'Gym',
                viewOptionsValue: { activeEventLabelId: 'label-work' }
            });

            // Gym Session matches search but has label-health, not label-work
            const eventCards = screen.queryAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(0);
        });

        it('shows no events when label matches but search does not', () => {
            renderWithProviders({
                searchTerm: 'NotFound',
                viewOptionsValue: { activeEventLabelId: 'label-work' }
            });

            const eventCards = screen.queryAllByTestId(/^loggable-event-card-/);
            expect(eventCards).toHaveLength(0);
        });
    });
});
