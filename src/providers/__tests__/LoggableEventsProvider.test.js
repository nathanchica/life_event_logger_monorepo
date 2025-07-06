import { useContext } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockEventLabel } from '../../mocks/eventLabels';
import { createMockLoggableEvent } from '../../mocks/loggableEvent';
import { createMockLoggableEventsContextValue } from '../../mocks/providers';
import LoggableEventsProvider, { LoggableEventsContext, useLoggableEventsContext } from '../LoggableEventsProvider';

// Mock uuid to have predictable IDs in tests
jest.mock('uuid', () => ({
    v4: () => 'mock-uuid'
}));

describe('LoggableEventsProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Component rendering', () => {
        it('renders children correctly', () => {
            render(
                <LoggableEventsProvider>
                    <div>Test Child Component</div>
                </LoggableEventsProvider>
            );

            expect(screen.getByText('Test Child Component')).toBeInTheDocument();
        });

        it('provides context value to children', () => {
            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(LoggableEventsContext);
                return null;
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            expect(contextValue).toMatchObject({
                loggableEvents: [],
                eventLabels: [],
                dataIsLoaded: false,
                createLoggableEvent: expect.any(Function),
                loadLoggableEvents: expect.any(Function),
                loadEventLabels: expect.any(Function),
                addTimestampToEvent: expect.any(Function),
                updateLoggableEventDetails: expect.any(Function),
                deleteLoggableEvent: expect.any(Function),
                createEventLabel: expect.any(Function),
                updateEventLabel: expect.any(Function),
                deleteEventLabel: expect.any(Function)
            });
        });
    });

    describe('createLoggableEvent functionality', () => {
        it('creates a new loggable event and adds it to the list', () => {
            const TestComponent = () => {
                const { loggableEvents, createLoggableEvent } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Event count: {loggableEvents.length}</span>
                        {loggableEvents.map((event) => (
                            <div key={event.id}>
                                <span>Name: {event.name}</span>
                                <span>Threshold: {event.warningThresholdInDays}</span>
                                <span>Labels: {event.labelIds.join(',')}</span>
                            </div>
                        ))}
                        <button onClick={() => createLoggableEvent('Test Event', 10, ['label-1', 'label-2'])}>
                            Create Event
                        </button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            expect(screen.getByText('Event count: 0')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /create event/i }));

            expect(screen.getByText('Event count: 1')).toBeInTheDocument();
            expect(screen.getByText('Name: Test Event')).toBeInTheDocument();
            expect(screen.getByText('Threshold: 10')).toBeInTheDocument();
            expect(screen.getByText('Labels: label-1,label-2')).toBeInTheDocument();
        });

        it('returns the newly created event with correct structure', () => {
            let createdEvent;
            const TestComponent = () => {
                const { createLoggableEvent } = useContext(LoggableEventsContext);
                return (
                    <button
                        onClick={() => {
                            createdEvent = createLoggableEvent('New Event', 5, ['label-3']);
                        }}
                    >
                        Create
                    </button>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /create/i }));

            expect(createdEvent).toMatchObject({
                id: 'temp-mock-uuid',
                name: 'New Event',
                timestamps: [],
                warningThresholdInDays: 5,
                labelIds: ['label-3'],
                isSynced: false
            });
            expect(createdEvent.createdAt).toBeInstanceOf(Date);
        });

        it.each([
            ['basic event', 'Basic Event', 7, []],
            ['event with labels', 'Event with Labels', 14, ['label-1', 'label-2']],
            ['event with high threshold', 'High Threshold', 30, ['label-3']]
        ])('creates %s correctly', (_, name, threshold, labels) => {
            const TestComponent = () => {
                const { loggableEvents, createLoggableEvent } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <button onClick={() => createLoggableEvent(name, threshold, labels)}>Create</button>
                        {loggableEvents.length > 0 && (
                            <div>
                                <span>Created: {loggableEvents[0].name}</span>
                                <span>Threshold: {loggableEvents[0].warningThresholdInDays}</span>
                            </div>
                        )}
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /create/i }));

            expect(screen.getByText(`Created: ${name}`)).toBeInTheDocument();
            expect(screen.getByText(`Threshold: ${threshold}`)).toBeInTheDocument();
        });
    });

    describe('Load data functionality', () => {
        it('loads loggable events correctly', () => {
            const mockEvents = [
                createMockLoggableEvent({ id: 'event-1', name: 'Event 1' }),
                createMockLoggableEvent({ id: 'event-2', name: 'Event 2' })
            ];

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Event count: {loggableEvents.length}</span>
                        {loggableEvents.map((event) => (
                            <span key={event.id}>{event.name}</span>
                        ))}
                        <button onClick={() => loadLoggableEvents(mockEvents)}>Load Events</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            expect(screen.getByText('Event count: 0')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /load events/i }));

            expect(screen.getByText('Event count: 2')).toBeInTheDocument();
            expect(screen.getByText('Event 1')).toBeInTheDocument();
            expect(screen.getByText('Event 2')).toBeInTheDocument();
        });

        it('loads event labels correctly', () => {
            const mockLabels = [
                createMockEventLabel({ id: 'label-1', name: 'Work' }),
                createMockEventLabel({ id: 'label-2', name: 'Personal' })
            ];

            const TestComponent = () => {
                const { eventLabels, loadEventLabels } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Label count: {eventLabels.length}</span>
                        {eventLabels.map((label) => (
                            <span key={label.id}>{label.name}</span>
                        ))}
                        <button onClick={() => loadEventLabels(mockLabels)}>Load Labels</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            expect(screen.getByText('Label count: 0')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /load labels/i }));

            expect(screen.getByText('Label count: 2')).toBeInTheDocument();
            expect(screen.getByText('Work')).toBeInTheDocument();
            expect(screen.getByText('Personal')).toBeInTheDocument();
        });
    });

    describe('addTimestampToEvent functionality', () => {
        it('adds a timestamp to an existing event', () => {
            const mockEvent = createMockLoggableEvent({
                id: 'event-1',
                timestamps: [new Date('2023-01-01T00:00:00Z')]
            });
            const newTimestamp = new Date('2023-01-02T00:00:00Z');

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents, addTimestampToEvent } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Timestamp count: {loggableEvents[0]?.timestamps.length || 0}</span>
                        <button onClick={() => loadLoggableEvents([mockEvent])}>Load</button>
                        <button onClick={() => addTimestampToEvent('event-1', newTimestamp)}>Add Timestamp</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            expect(screen.getByText('Timestamp count: 1')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /add timestamp/i }));
            expect(screen.getByText('Timestamp count: 2')).toBeInTheDocument();
        });

        it('sorts timestamps by newest first', () => {
            const mockEvent = createMockLoggableEvent({
                id: 'event-1',
                timestamps: [new Date('2023-01-15T00:00:00Z')]
            });
            const olderDate = new Date('2023-01-01T00:00:00Z');
            const newerDate = new Date('2023-01-30T00:00:00Z');

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents, addTimestampToEvent } = useContext(LoggableEventsContext);
                const timestamps = loggableEvents[0]?.timestamps || [];
                return (
                    <div>
                        {timestamps.map((ts, index) => (
                            <span key={index}>
                                Date {index}: {ts.toISOString()}
                            </span>
                        ))}
                        <button onClick={() => loadLoggableEvents([mockEvent])}>Load</button>
                        <button onClick={() => addTimestampToEvent('event-1', olderDate)}>Add Older</button>
                        <button onClick={() => addTimestampToEvent('event-1', newerDate)}>Add Newer</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            userEvent.click(screen.getByRole('button', { name: /add older/i }));
            userEvent.click(screen.getByRole('button', { name: /add newer/i }));

            // Should be sorted newest first
            expect(screen.getByText('Date 0: 2023-01-30T00:00:00.000Z')).toBeInTheDocument();
            expect(screen.getByText('Date 1: 2023-01-15T00:00:00.000Z')).toBeInTheDocument();
            expect(screen.getByText('Date 2: 2023-01-01T00:00:00.000Z')).toBeInTheDocument();
        });

        it('does not affect other events', () => {
            const mockEvents = [
                createMockLoggableEvent({ id: 'event-1', timestamps: [] }),
                createMockLoggableEvent({ id: 'event-2', timestamps: [] })
            ];

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents, addTimestampToEvent } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Event 1 count: {loggableEvents[0]?.timestamps.length || 0}</span>
                        <span>Event 2 count: {loggableEvents[1]?.timestamps.length || 0}</span>
                        <button onClick={() => loadLoggableEvents(mockEvents)}>Load</button>
                        <button onClick={() => addTimestampToEvent('event-1', new Date())}>Add to Event 1</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            userEvent.click(screen.getByRole('button', { name: /add to event 1/i }));

            expect(screen.getByText('Event 1 count: 1')).toBeInTheDocument();
            expect(screen.getByText('Event 2 count: 0')).toBeInTheDocument();
        });
    });

    describe('updateLoggableEventDetails functionality', () => {
        it('updates event details correctly', () => {
            const mockEvent = createMockLoggableEvent({
                id: 'event-1',
                name: 'Original Name',
                warningThresholdInDays: 7
            });

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents, updateLoggableEventDetails } =
                    useContext(LoggableEventsContext);
                const event = loggableEvents[0];
                return (
                    <div>
                        {event && (
                            <>
                                <span>Name: {event.name}</span>
                                <span>Threshold: {event.warningThresholdInDays}</span>
                            </>
                        )}
                        <button onClick={() => loadLoggableEvents([mockEvent])}>Load</button>
                        <button
                            onClick={() =>
                                updateLoggableEventDetails({
                                    ...mockEvent,
                                    name: 'Updated Name',
                                    warningThresholdInDays: 14
                                })
                            }
                        >
                            Update
                        </button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            expect(screen.getByText('Name: Original Name')).toBeInTheDocument();
            expect(screen.getByText('Threshold: 7')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /update/i }));
            expect(screen.getByText('Name: Updated Name')).toBeInTheDocument();
            expect(screen.getByText('Threshold: 14')).toBeInTheDocument();
        });

        it.each([
            ['name only', { name: 'New Name' }],
            ['threshold only', { warningThresholdInDays: 21 }],
            ['labels only', { labelIds: ['new-label-1', 'new-label-2'] }],
            ['multiple properties', { name: 'New Name', warningThresholdInDays: 21, labelIds: ['new'] }]
        ])('updates %s correctly', (_, updates) => {
            const mockEvent = createMockLoggableEvent({ id: 'event-1' });

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents, updateLoggableEventDetails } =
                    useContext(LoggableEventsContext);
                const event = loggableEvents[0];
                return (
                    <div>
                        {event && <span>Event loaded</span>}
                        <button onClick={() => loadLoggableEvents([mockEvent])}>Load</button>
                        <button onClick={() => updateLoggableEventDetails({ ...mockEvent, ...updates })}>Update</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            userEvent.click(screen.getByRole('button', { name: /update/i }));

            expect(screen.getByText('Event loaded')).toBeInTheDocument();
        });

        it('updates only the correct event when there are multiple events', () => {
            const mockEvents = [
                createMockLoggableEvent({ id: 'event-1', name: 'Event 1', warningThresholdInDays: 7 }),
                createMockLoggableEvent({ id: 'event-2', name: 'Event 2', warningThresholdInDays: 14 }),
                createMockLoggableEvent({ id: 'event-3', name: 'Event 3', warningThresholdInDays: 21 })
            ];

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents, updateLoggableEventDetails } =
                    useContext(LoggableEventsContext);
                return (
                    <div>
                        {loggableEvents.map((event) => (
                            <div key={event.id}>
                                <span>
                                    {event.name}: {event.warningThresholdInDays} days
                                </span>
                            </div>
                        ))}
                        <button onClick={() => loadLoggableEvents(mockEvents)}>Load</button>
                        <button
                            onClick={() =>
                                updateLoggableEventDetails({
                                    ...mockEvents[1],
                                    name: 'Updated Event 2',
                                    warningThresholdInDays: 30
                                })
                            }
                        >
                            Update Event 2
                        </button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            expect(screen.getByText('Event 1: 7 days')).toBeInTheDocument();
            expect(screen.getByText('Event 2: 14 days')).toBeInTheDocument();
            expect(screen.getByText('Event 3: 21 days')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /update event 2/i }));

            // Event 2 should be updated
            expect(screen.getByText('Updated Event 2: 30 days')).toBeInTheDocument();
            // Other events should remain unchanged
            expect(screen.getByText('Event 1: 7 days')).toBeInTheDocument();
            expect(screen.getByText('Event 3: 21 days')).toBeInTheDocument();
            // Original Event 2 should no longer exist
            expect(screen.queryByText('Event 2: 14 days')).not.toBeInTheDocument();
        });
    });

    describe('deleteLoggableEvent functionality', () => {
        it('removes event from the list', () => {
            const mockEvents = [
                createMockLoggableEvent({ id: 'event-1', name: 'Event 1' }),
                createMockLoggableEvent({ id: 'event-2', name: 'Event 2' })
            ];

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents, deleteLoggableEvent } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Event count: {loggableEvents.length}</span>
                        {loggableEvents.map((event) => (
                            <span key={event.id}>{event.name}</span>
                        ))}
                        <button onClick={() => loadLoggableEvents(mockEvents)}>Load</button>
                        <button onClick={() => deleteLoggableEvent('event-1')}>Delete Event 1</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            expect(screen.getByText('Event count: 2')).toBeInTheDocument();
            expect(screen.getByText('Event 1')).toBeInTheDocument();
            expect(screen.getByText('Event 2')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /delete event 1/i }));
            expect(screen.getByText('Event count: 1')).toBeInTheDocument();
            expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
            expect(screen.getByText('Event 2')).toBeInTheDocument();
        });

        it('handles deleting non-existent event gracefully', () => {
            const mockEvent = createMockLoggableEvent({ id: 'event-1', name: 'Event 1' });

            const TestComponent = () => {
                const { loggableEvents, loadLoggableEvents, deleteLoggableEvent } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Event count: {loggableEvents.length}</span>
                        <button onClick={() => loadLoggableEvents([mockEvent])}>Load</button>
                        <button onClick={() => deleteLoggableEvent('non-existent')}>Delete Non-existent</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            expect(screen.getByText('Event count: 1')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /delete non-existent/i }));
            expect(screen.getByText('Event count: 1')).toBeInTheDocument();
        });
    });

    describe('Event label operations', () => {
        it('creates a new event label', () => {
            const TestComponent = () => {
                const { eventLabels, createEventLabel } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Label count: {eventLabels.length}</span>
                        {eventLabels.map((label) => (
                            <span key={label.id}>Name: {label.name}</span>
                        ))}
                        <button onClick={() => createEventLabel('New Label')}>Create Label</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            expect(screen.getByText('Label count: 0')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /create label/i }));

            expect(screen.getByText('Label count: 1')).toBeInTheDocument();
            expect(screen.getByText('Name: New Label')).toBeInTheDocument();
        });

        it('returns the newly created label with correct structure', () => {
            let createdLabel;
            const TestComponent = () => {
                const { createEventLabel } = useContext(LoggableEventsContext);
                return (
                    <button
                        onClick={() => {
                            createdLabel = createEventLabel('Test Label');
                        }}
                    >
                        Create
                    </button>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /create/i }));

            expect(createdLabel).toMatchObject({
                id: 'temp-mock-uuid',
                name: 'Test Label',
                isSynced: false
            });
            expect(createdLabel.createdAt).toBeInstanceOf(Date);
        });

        it('updates event label details correctly', () => {
            const mockLabel = createMockEventLabel({ id: 'label-1', name: 'Original Label' });

            const TestComponent = () => {
                const { eventLabels, loadEventLabels, updateEventLabel } = useContext(LoggableEventsContext);
                const label = eventLabels[0];
                return (
                    <div>
                        {label && <span>Name: {label.name}</span>}
                        <button onClick={() => loadEventLabels([mockLabel])}>Load</button>
                        <button onClick={() => updateEventLabel({ ...mockLabel, name: 'Updated Label' })}>
                            Update
                        </button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            expect(screen.getByText('Name: Original Label')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /update/i }));
            expect(screen.getByText('Name: Updated Label')).toBeInTheDocument();
        });

        it('updates only the correct label when there are multiple labels', () => {
            const mockLabels = [
                createMockEventLabel({ id: 'label-1', name: 'Work' }),
                createMockEventLabel({ id: 'label-2', name: 'Personal' }),
                createMockEventLabel({ id: 'label-3', name: 'Health' })
            ];

            const TestComponent = () => {
                const { eventLabels, loadEventLabels, updateEventLabel } = useContext(LoggableEventsContext);
                return (
                    <div>
                        {eventLabels.map((label) => (
                            <span key={label.id}>Label: {label.name}</span>
                        ))}
                        <button onClick={() => loadEventLabels(mockLabels)}>Load</button>
                        <button
                            onClick={() =>
                                updateEventLabel({
                                    ...mockLabels[1],
                                    name: 'Updated Personal'
                                })
                            }
                        >
                            Update Personal Label
                        </button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            expect(screen.getByText('Label: Work')).toBeInTheDocument();
            expect(screen.getByText('Label: Personal')).toBeInTheDocument();
            expect(screen.getByText('Label: Health')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /update personal label/i }));

            // Personal label should be updated
            expect(screen.getByText('Label: Updated Personal')).toBeInTheDocument();
            // Other labels should remain unchanged
            expect(screen.getByText('Label: Work')).toBeInTheDocument();
            expect(screen.getByText('Label: Health')).toBeInTheDocument();
            // Original Personal label should no longer exist
            expect(screen.queryByText('Label: Personal')).not.toBeInTheDocument();
        });

        it('deletes event label from the list', () => {
            const mockLabels = [
                createMockEventLabel({ id: 'label-1', name: 'Label 1' }),
                createMockEventLabel({ id: 'label-2', name: 'Label 2' })
            ];

            const TestComponent = () => {
                const { eventLabels, loadEventLabels, deleteEventLabel } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Label count: {eventLabels.length}</span>
                        {eventLabels.map((label) => (
                            <span key={label.id}>{label.name}</span>
                        ))}
                        <button onClick={() => loadEventLabels(mockLabels)}>Load</button>
                        <button onClick={() => deleteEventLabel('label-1')}>Delete Label 1</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load/i }));
            expect(screen.getByText('Label count: 2')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /delete label 1/i }));
            expect(screen.getByText('Label count: 1')).toBeInTheDocument();
            expect(screen.queryByText('Label 1')).not.toBeInTheDocument();
            expect(screen.getByText('Label 2')).toBeInTheDocument();
        });
    });

    describe('useLoggableEventsContext hook', () => {
        it('returns context value when used inside provider', () => {
            let hookResult;
            const TestComponent = () => {
                hookResult = useLoggableEventsContext();
                return null;
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            expect(hookResult).toMatchObject({
                loggableEvents: [],
                eventLabels: [],
                dataIsLoaded: false,
                createLoggableEvent: expect.any(Function),
                loadLoggableEvents: expect.any(Function),
                loadEventLabels: expect.any(Function),
                addTimestampToEvent: expect.any(Function),
                updateLoggableEventDetails: expect.any(Function),
                deleteLoggableEvent: expect.any(Function),
                createEventLabel: expect.any(Function),
                updateEventLabel: expect.any(Function),
                deleteEventLabel: expect.any(Function)
            });
        });

        it('throws error when used outside provider', () => {
            const TestComponent = () => {
                useLoggableEventsContext();
                return null;
            };

            const consoleError = jest.spyOn(console, 'error').mockImplementation();

            expect(() => {
                render(<TestComponent />);
            }).toThrow('This component must be wrapped by LoggableEventsProvider');

            consoleError.mockRestore();
        });
    });

    describe('dataIsLoaded state management', () => {
        it('sets dataIsLoaded to true when both events and labels are loaded', async () => {
            const mockEvents = [createMockLoggableEvent()];
            const mockLabels = [createMockEventLabel()];

            const TestComponent = () => {
                const { dataIsLoaded, loadLoggableEvents, loadEventLabels } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Data loaded: {dataIsLoaded ? 'yes' : 'no'}</span>
                        <button onClick={() => loadLoggableEvents(mockEvents)}>Load Events</button>
                        <button onClick={() => loadEventLabels(mockLabels)}>Load Labels</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            expect(screen.getByText('Data loaded: no')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /load events/i }));
            expect(screen.getByText('Data loaded: no')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /load labels/i }));
            await waitFor(() => {
                expect(screen.getByText('Data loaded: yes')).toBeInTheDocument();
            });
        });

        it('remains false if only events are loaded', () => {
            const mockEvents = [createMockLoggableEvent()];

            const TestComponent = () => {
                const { dataIsLoaded, loadLoggableEvents } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Data loaded: {dataIsLoaded ? 'yes' : 'no'}</span>
                        <button onClick={() => loadLoggableEvents(mockEvents)}>Load Events</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load events/i }));
            expect(screen.getByText('Data loaded: no')).toBeInTheDocument();
        });

        it('remains false if only labels are loaded', () => {
            const mockLabels = [createMockEventLabel()];

            const TestComponent = () => {
                const { dataIsLoaded, loadEventLabels } = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Data loaded: {dataIsLoaded ? 'yes' : 'no'}</span>
                        <button onClick={() => loadEventLabels(mockLabels)}>Load Labels</button>
                    </div>
                );
            };

            render(
                <LoggableEventsProvider>
                    <TestComponent />
                </LoggableEventsProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /load labels/i }));
            expect(screen.getByText('Data loaded: no')).toBeInTheDocument();
        });
    });

    describe('Context value using mock provider', () => {
        it('allows testing with mock context values', () => {
            const mockCreateLoggableEvent = jest.fn();
            const mockUpdateLoggableEvent = jest.fn();
            const mockEvents = [createMockLoggableEvent({ id: 'mock-1', name: 'Mock Event' })];
            const mockLabels = [createMockEventLabel({ id: 'mock-label', name: 'Mock Label' })];

            const mockContextValue = createMockLoggableEventsContextValue({
                loggableEvents: mockEvents,
                eventLabels: mockLabels,
                dataIsLoaded: true,
                createLoggableEvent: mockCreateLoggableEvent,
                updateLoggableEventDetails: mockUpdateLoggableEvent
            });

            const TestComponent = () => {
                const context = useContext(LoggableEventsContext);
                return (
                    <div>
                        <span>Events: {context.loggableEvents.length}</span>
                        <span>Labels: {context.eventLabels.length}</span>
                        <span>Loaded: {context.dataIsLoaded ? 'yes' : 'no'}</span>
                        <button onClick={() => context.createLoggableEvent('New', 7, [])}>Create</button>
                        <button onClick={() => context.updateLoggableEventDetails(mockEvents[0])}>Update</button>
                    </div>
                );
            };

            render(
                <LoggableEventsContext.Provider value={mockContextValue}>
                    <TestComponent />
                </LoggableEventsContext.Provider>
            );

            expect(screen.getByText('Events: 1')).toBeInTheDocument();
            expect(screen.getByText('Labels: 1')).toBeInTheDocument();
            expect(screen.getByText('Loaded: yes')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /create/i }));
            expect(mockCreateLoggableEvent).toHaveBeenCalledWith('New', 7, []);

            userEvent.click(screen.getByRole('button', { name: /update/i }));
            expect(mockUpdateLoggableEvent).toHaveBeenCalledWith(mockEvents[0]);
        });
    });
});
