import { LoggableEvent } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestClient, TestGraphQLClient } from '../../../mocks/client.js';
import prismaMock from '../../../prisma/__mocks__/client.js';
import { getIdEncoder } from '../../../utils/encoder.js';
import { createMockEventLabel } from '../../eventLabel/__mocks__/eventLabel.js';
import { createMockUserWithRelations } from '../../user/__mocks__/user.js';
import { UserParent } from '../../user/index.js';
import { createMockLoggableEvent } from '../__mocks__/loggableEvent.js';
import { MAX_EVENT_NAME_LENGTH } from '../index.js';

// Helper to encode user ID for expected responses
const encodeUserId = (userId: string): string => {
    const encoder = getIdEncoder();
    return encoder.encode(userId, 'user');
};

// Helper to encode event ID for expected responses
const encodeEventId = (eventId: string): string => {
    const encoder = getIdEncoder();
    return encoder.encode(eventId, 'loggableEvent');
};

// Helper to encode label ID for expected responses
const encodeLabelId = (labelId: string): string => {
    const encoder = getIdEncoder();
    return encoder.encode(labelId, 'eventLabel');
};

describe('LoggableEvent GraphQL', () => {
    let client: TestGraphQLClient;

    beforeEach(() => {
        client = createTestClient();
    });

    describe('createLoggableEvent mutation', () => {
        const CREATE_LOGGABLE_EVENT = `
            mutation CreateLoggableEvent($input: CreateLoggableEventMutationInput!) {
                createLoggableEvent(input: $input) {
                    tempID
                    loggableEvent {
                        id
                        name
                        timestamps
                        warningThresholdInDays
                        createdAt
                        updatedAt
                        user {
                            id
                            name
                            email
                        }
                        labels {
                            id
                            name
                        }
                    }
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        it('should create a new loggable event successfully', async () => {
            const mockUser = createMockUserWithRelations({
                name: 'Test User',
                email: 'test@example.com'
            });
            const mockEvent = createMockLoggableEvent({
                name: 'Exercise',
                warningThresholdInDays: 7,
                userId: mockUser.id,
                labelIds: [],
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            });

            // Mock for checking if event name already exists
            prismaMock.loggableEvent.findFirst.mockResolvedValue(null);
            // Mock for creating the event
            prismaMock.loggableEvent.create.mockResolvedValue(mockEvent);
            // Mock for LoggableEvent.user field resolver
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            // Mock for LoggableEvent.labels field resolver (empty labels)
            prismaMock.eventLabel.findMany.mockResolvedValue([]);

            const { data, errors } = await client.request(
                CREATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Exercise',
                        warningThresholdInDays: 7
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.createLoggableEvent).toEqual({
                tempID: 'temp-123',
                loggableEvent: {
                    id: encodeEventId(mockEvent.id),
                    name: 'Exercise',
                    timestamps: [],
                    warningThresholdInDays: 7,
                    createdAt: mockEvent.createdAt.toISOString(),
                    updatedAt: mockEvent.updatedAt.toISOString(),
                    user: {
                        id: encodeUserId(mockUser.id),
                        name: 'Test User',
                        email: 'test@example.com'
                    },
                    labels: []
                },
                errors: []
            });

            expect(prismaMock.loggableEvent.findFirst).toHaveBeenCalledWith({
                where: {
                    name: 'Exercise',
                    userId: mockUser.id
                }
            });

            expect(prismaMock.loggableEvent.create).toHaveBeenCalledWith({
                data: {
                    name: 'Exercise',
                    warningThresholdInDays: 7,
                    userId: mockUser.id,
                    timestamps: []
                },
                include: { labels: true }
            });
        });

        it('should create a loggable event with labels successfully', async () => {
            const mockUser = createMockUserWithRelations({
                name: 'Test User',
                email: 'test@example.com'
            });
            const mockLabel = createMockEventLabel({
                name: 'Health',
                userId: mockUser.id
            });
            const mockEvent = createMockLoggableEvent({
                name: 'Exercise',
                warningThresholdInDays: 7,
                userId: mockUser.id,
                labelIds: [mockLabel.id],
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            });

            // Mock for checking if event name already exists
            prismaMock.loggableEvent.findFirst.mockResolvedValue(null);
            // Mock for validateLabelOwnership - checking if labels belong to user
            prismaMock.eventLabel.findMany.mockResolvedValueOnce([mockLabel]);
            // Mock for creating the event
            prismaMock.loggableEvent.create.mockResolvedValue(mockEvent);
            // Mock for LoggableEvent.user field resolver
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            // Mock for LoggableEvent.labels field resolver
            prismaMock.eventLabel.findMany.mockResolvedValueOnce([mockLabel]);

            const { data, errors } = await client.request(
                CREATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Exercise',
                        warningThresholdInDays: 7,
                        labelIds: [encodeLabelId(mockLabel.id)]
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.createLoggableEvent).toEqual({
                tempID: 'temp-123',
                loggableEvent: {
                    id: encodeEventId(mockEvent.id),
                    name: 'Exercise',
                    timestamps: [],
                    warningThresholdInDays: 7,
                    createdAt: mockEvent.createdAt.toISOString(),
                    updatedAt: mockEvent.updatedAt.toISOString(),
                    user: {
                        id: encodeUserId(mockUser.id),
                        name: 'Test User',
                        email: 'test@example.com'
                    },
                    labels: [
                        {
                            id: encodeLabelId(mockLabel.id),
                            name: 'Health'
                        }
                    ]
                },
                errors: []
            });

            expect(prismaMock.eventLabel.findMany).toHaveBeenCalledWith({
                where: {
                    id: { in: [mockLabel.id] },
                    userId: mockUser.id
                },
                select: { id: true }
            });

            expect(prismaMock.loggableEvent.create).toHaveBeenCalledWith({
                data: {
                    name: 'Exercise',
                    warningThresholdInDays: 7,
                    userId: mockUser.id,
                    timestamps: [],
                    labels: {
                        connect: [{ id: mockLabel.id }]
                    }
                },
                include: { labels: true }
            });
        });

        it.each([
            {
                scenario: 'empty name',
                name: '',
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: 'Name cannot be empty'
                }
            },
            {
                scenario: 'name too long',
                name: 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1),
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: `Name must be under ${MAX_EVENT_NAME_LENGTH} characters`
                }
            },
            {
                scenario: 'negative warning threshold',
                name: 'Exercise',
                warningThresholdInDays: -1,
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'warningThresholdInDays',
                    message: 'Warning threshold must be a positive number'
                }
            }
        ])(
            'should return validation error for $scenario',
            async ({ name, warningThresholdInDays = 7, expectedError }) => {
                const mockUser = createMockUserWithRelations();

                const { data, errors } = await client.request(
                    CREATE_LOGGABLE_EVENT,
                    {
                        input: {
                            id: 'temp-123',
                            name,
                            warningThresholdInDays
                        }
                    },
                    { user: mockUser, prisma: prismaMock }
                );

                expect(errors).toBeUndefined();
                expect(data.createLoggableEvent.errors).toEqual([expectedError]);
                expect(data.createLoggableEvent.loggableEvent).toBeNull();
                expect(prismaMock.loggableEvent.create).not.toHaveBeenCalled();
            }
        );

        it('should return error when event name already exists', async () => {
            const mockUser = createMockUserWithRelations();
            const existingEvent = createMockLoggableEvent({
                name: 'Exercise',
                userId: mockUser.id
            });

            // Mock for checking if event name already exists (returns existing event)
            prismaMock.loggableEvent.findFirst.mockResolvedValue(existingEvent);

            const { data, errors } = await client.request(
                CREATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Exercise',
                        warningThresholdInDays: 7
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.createLoggableEvent.errors).toEqual([
                {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: 'An event with this name already exists'
                }
            ]);
            expect(data.createLoggableEvent.loggableEvent).toBeNull();
            expect(prismaMock.loggableEvent.create).not.toHaveBeenCalled();
        });

        it('should return error when labelIds do not belong to user', async () => {
            const mockUser = createMockUserWithRelations();
            const nonExistentLabel = createMockEventLabel();

            // Mock for checking if event name already exists
            prismaMock.loggableEvent.findFirst.mockResolvedValue(null);
            // Mock for validateLabelOwnership - returns empty array to trigger error
            prismaMock.eventLabel.findMany.mockResolvedValue([]);

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                CREATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Exercise',
                        warningThresholdInDays: 7,
                        labelIds: [encodeLabelId(nonExistentLabel.id)]
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('FORBIDDEN');
            expect(data).toBeNull();
            expect(prismaMock.loggableEvent.create).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should handle database errors', async () => {
            const mockUser = createMockUserWithRelations();

            // Mock database failure when checking if event name exists
            prismaMock.loggableEvent.findFirst.mockRejectedValue(new Error('Database connection failed'));

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                CREATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Exercise',
                        warningThresholdInDays: 7
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });

        it('should return auth error when user is not authenticated', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                CREATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Exercise',
                        warningThresholdInDays: 7
                    }
                },
                { user: null, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('UNAUTHORIZED');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });

        it('should return error when user not found in field resolver', async () => {
            const mockUser = createMockUserWithRelations({
                name: 'Test User',
                email: 'test@example.com'
            });
            const mockEvent = createMockLoggableEvent({
                name: 'Exercise',
                warningThresholdInDays: 7,
                userId: mockUser.id,
                labelIds: [],
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            });

            // Mock for checking if event name already exists
            prismaMock.loggableEvent.findFirst.mockResolvedValue(null);
            // Mock for creating the event
            prismaMock.loggableEvent.create.mockResolvedValue(mockEvent);
            // Mock for LoggableEvent.user field resolver - user not found
            prismaMock.user.findUnique.mockResolvedValue(null);
            // Mock for LoggableEvent.labels field resolver
            prismaMock.eventLabel.findMany.mockResolvedValue([]);

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                CREATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Exercise',
                        warningThresholdInDays: 7
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            // Field resolver error - partial data with error
            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('NOT_FOUND');
            expect(errors[0].path).toEqual(['createLoggableEvent', 'loggableEvent', 'user']);

            // The mutation itself succeeded, but the field resolver failed
            expect(data.createLoggableEvent.tempID).toBe('temp-123');
            expect(data.createLoggableEvent.errors).toEqual([]);
            // When a non-nullable field resolver fails, the parent object becomes null
            expect(data.createLoggableEvent.loggableEvent).toBeNull();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('updateLoggableEvent mutation', () => {
        const UPDATE_LOGGABLE_EVENT = `
            mutation UpdateLoggableEvent($input: UpdateLoggableEventMutationInput!) {
                updateLoggableEvent(input: $input) {
                    loggableEvent {
                        id
                        name
                        timestamps
                        warningThresholdInDays
                        createdAt
                        updatedAt
                        user {
                            id
                            name
                            email
                        }
                        labels {
                            id
                            name
                        }
                    }
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        let mockUser: UserParent;
        let existingEventToUpdate: LoggableEvent;
        let existingEventEncodedId: string;

        beforeEach(() => {
            mockUser = createMockUserWithRelations();
            existingEventToUpdate = createMockLoggableEvent({
                name: 'Go on a walk',
                userId: mockUser.id,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
                warningThresholdInDays: 7
            });
            existingEventEncodedId = encodeEventId(existingEventToUpdate.id);
        });

        it.each([
            {
                scenario: 'update event name',
                inputOverrides: {
                    name: 'Running'
                },
                expectedUpdateData: {
                    name: 'Running'
                },
                updatedEventOverrides: {
                    name: 'Running'
                },
                expectedEventOverrides: {
                    name: 'Running'
                }
            },
            {
                scenario: 'update warning threshold',
                inputOverrides: {
                    warningThresholdInDays: 14
                },
                expectedUpdateData: {
                    warningThresholdInDays: 14
                },
                updatedEventOverrides: {
                    warningThresholdInDays: 14
                },
                expectedEventOverrides: {
                    warningThresholdInDays: 14
                }
            },
            {
                scenario: 'update timestamps',
                inputOverrides: {
                    timestamps: [new Date('2024-01-01').toISOString(), new Date('2024-01-02').toISOString()]
                },
                expectedUpdateData: {
                    timestamps: {
                        set: [new Date('2024-01-02'), new Date('2024-01-01')]
                    }
                },
                updatedEventOverrides: {
                    timestamps: [new Date('2024-01-02'), new Date('2024-01-01')]
                },
                expectedEventOverrides: {
                    timestamps: [new Date('2024-01-02').toISOString(), new Date('2024-01-01').toISOString()]
                }
            }
        ])(
            'should $scenario successfully',
            async ({ inputOverrides, expectedUpdateData, updatedEventOverrides, expectedEventOverrides }) => {
                const input = {
                    id: existingEventEncodedId,
                    ...inputOverrides
                };
                const updatedEvent = createMockLoggableEvent({
                    id: existingEventToUpdate.id,
                    ...updatedEventOverrides
                });
                const expectedEvent = {
                    id: existingEventEncodedId,
                    ...expectedEventOverrides
                };

                // Mock for @requireOwner directive - checking ownership
                prismaMock.loggableEvent.findUnique.mockResolvedValue(existingEventToUpdate);

                if ('name' in input) {
                    // Mock for checking if new name already exists
                    prismaMock.loggableEvent.findFirst.mockResolvedValue(null);
                }

                // Mock for updating the event
                prismaMock.loggableEvent.update.mockResolvedValue(updatedEvent);
                // Mock for LoggableEvent.user field resolver
                prismaMock.user.findUnique.mockResolvedValue(mockUser);
                // Mock for LoggableEvent.labels field resolver
                prismaMock.eventLabel.findMany.mockResolvedValue([]);

                const { data, errors } = await client.request(
                    UPDATE_LOGGABLE_EVENT,
                    { input },
                    { user: mockUser, prisma: prismaMock }
                );

                expect(errors).toBeUndefined();
                expect(data.updateLoggableEvent.errors).toEqual([]);
                expect(data.updateLoggableEvent.loggableEvent).toEqual(expect.objectContaining(expectedEvent));

                expect(prismaMock.loggableEvent.update).toHaveBeenCalledWith({
                    where: { id: existingEventToUpdate.id },
                    data: expectedUpdateData,
                    include: { labels: true }
                });
            }
        );

        it('should update labels successfully', async () => {
            const mockLabel = createMockEventLabel({
                name: 'Health',
                userId: mockUser.id
            });
            const encodedLabelId = encodeLabelId(mockLabel.id);

            const updatedEvent = {
                ...existingEventToUpdate,
                labelIds: [mockLabel.id]
            };

            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValue(existingEventToUpdate);
            // Mock for validateLabelOwnership - checking if labels belong to user
            prismaMock.eventLabel.findMany.mockResolvedValueOnce([mockLabel]);
            // Mock for updating the event
            prismaMock.loggableEvent.update.mockResolvedValue(updatedEvent);
            // Mock for LoggableEvent.user field resolver
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            // Mock for LoggableEvent.labels field resolver
            prismaMock.eventLabel.findMany.mockResolvedValueOnce([mockLabel]);

            const { data, errors } = await client.request(
                UPDATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: existingEventEncodedId,
                        labelIds: [encodedLabelId]
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateLoggableEvent.loggableEvent.labels).toEqual([
                {
                    id: encodedLabelId,
                    name: mockLabel.name
                }
            ]);
            expect(data.updateLoggableEvent.errors).toEqual([]);

            expect(prismaMock.loggableEvent.update).toHaveBeenCalledWith({
                where: { id: existingEventToUpdate.id },
                data: {
                    labels: {
                        set: [{ id: mockLabel.id }]
                    }
                },
                include: { labels: true }
            });
        });

        it.each([
            {
                scenario: 'empty name',
                inputOverrides: {
                    name: ''
                },
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: 'Name cannot be empty'
                }
            },
            {
                scenario: 'name too long',
                inputOverrides: {
                    name: 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1)
                },
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: `Name must be under ${MAX_EVENT_NAME_LENGTH} characters`
                }
            },
            {
                scenario: 'negative warning threshold',
                inputOverrides: {
                    warningThresholdInDays: -1
                },
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'warningThresholdInDays',
                    message: 'Warning threshold must be a positive number'
                }
            }
        ])('should return validation error for $scenario', async ({ inputOverrides, expectedError }) => {
            const input = {
                id: existingEventEncodedId,
                ...inputOverrides
            };

            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValue(existingEventToUpdate);

            const { data, errors } = await client.request(
                UPDATE_LOGGABLE_EVENT,
                { input },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateLoggableEvent.errors).toEqual([expectedError]);
            expect(data.updateLoggableEvent.loggableEvent).toBeNull();
            expect(prismaMock.loggableEvent.update).not.toHaveBeenCalled();
        });

        it('should return error when updating to duplicate name', async () => {
            const existingEventWithDuplicateName = createMockLoggableEvent({
                name: 'Running',
                userId: mockUser.id
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValue(existingEventToUpdate);
            // Mock for checking if new name already exists (returns existing event)
            prismaMock.loggableEvent.findFirst.mockResolvedValue(existingEventWithDuplicateName);

            const { data, errors } = await client.request(
                UPDATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: existingEventEncodedId,
                        name: 'Running'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateLoggableEvent.errors).toEqual([
                {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: 'An event with this name already exists'
                }
            ]);
            expect(data.updateLoggableEvent.loggableEvent).toBeNull();
            expect(prismaMock.loggableEvent.update).not.toHaveBeenCalled();
        });

        it('should return auth error when event belongs to another user', async () => {
            const otherUser = createMockUserWithRelations();
            const mockEventOwnedByOtherUser = createMockLoggableEvent({
                userId: otherUser.id
            });

            // Mock for @requireOwner directive - returns event with different userId
            prismaMock.loggableEvent.findUnique.mockResolvedValue(mockEventOwnedByOtherUser);

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                UPDATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: encodeEventId(mockEventOwnedByOtherUser.id),
                        name: 'Running'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('FORBIDDEN');
            expect(data).toBeNull();
            expect(prismaMock.loggableEvent.update).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should return internal error when database fails during name uniqueness check', async () => {
            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValue(existingEventToUpdate);
            // Mock database failure when checking if new name already exists
            prismaMock.loggableEvent.findFirst.mockRejectedValue(new Error('Database connection failed'));

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                UPDATE_LOGGABLE_EVENT,
                {
                    input: {
                        id: existingEventEncodedId,
                        name: 'Running'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();
            expect(prismaMock.loggableEvent.update).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('deleteLoggableEvent mutation', () => {
        const DELETE_LOGGABLE_EVENT = `
            mutation DeleteLoggableEvent($input: DeleteLoggableEventMutationInput!) {
                deleteLoggableEvent(input: $input) {
                    loggableEvent {
                        id
                        name
                    }
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        let mockUser: UserParent;
        let existingEventToDelete: LoggableEvent;
        let existingEventEncodedId: string;

        beforeEach(() => {
            mockUser = createMockUserWithRelations();
            existingEventToDelete = createMockLoggableEvent({
                name: 'Go on a walk',
                userId: mockUser.id,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
                warningThresholdInDays: 7
            });
            existingEventEncodedId = encodeEventId(existingEventToDelete.id);
        });

        it('should delete event successfully', async () => {
            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValue(existingEventToDelete);
            // Mock for deleting the event
            prismaMock.loggableEvent.delete.mockResolvedValue(existingEventToDelete);

            const { data, errors } = await client.request(
                DELETE_LOGGABLE_EVENT,
                {
                    input: {
                        id: existingEventEncodedId
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.deleteLoggableEvent).toEqual({
                loggableEvent: {
                    id: existingEventEncodedId,
                    name: existingEventToDelete.name
                },
                errors: []
            });

            expect(prismaMock.loggableEvent.delete).toHaveBeenCalledWith({
                where: { id: existingEventToDelete.id },
                include: { labels: true }
            });
        });

        it('should return auth error when event belongs to another user', async () => {
            const otherUser = createMockUserWithRelations();
            const mockEventOwnedByOtherUser = createMockLoggableEvent({
                userId: otherUser.id
            });

            // Mock for @requireOwner directive - returns event with different userId
            prismaMock.loggableEvent.findUnique.mockResolvedValue(mockEventOwnedByOtherUser);

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                DELETE_LOGGABLE_EVENT,
                {
                    input: {
                        id: encodeEventId(mockEventOwnedByOtherUser.id)
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('FORBIDDEN');
            expect(data).toBeNull();
            expect(prismaMock.loggableEvent.delete).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should return internal error when database fails during delete', async () => {
            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValue(existingEventToDelete);
            // Mock database failure when attempting to delete
            prismaMock.loggableEvent.delete.mockRejectedValue(new Error('Database connection failed'));

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                DELETE_LOGGABLE_EVENT,
                {
                    input: {
                        id: existingEventEncodedId
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            // Masked error in GraphQL response
            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            // Verify delete was attempted
            expect(prismaMock.loggableEvent.delete).toHaveBeenCalledWith({
                where: { id: existingEventToDelete.id },
                include: { labels: true }
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('addTimestampToEvent mutation', () => {
        const ADD_TIMESTAMP_TO_EVENT = `
            mutation AddTimestampToEvent($input: AddTimestampToEventMutationInput!) {
                addTimestampToEvent(input: $input) {
                    loggableEvent {
                        id
                        name
                        timestamps
                    }
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        let mockUser: UserParent;
        let existingEventToUpdate: LoggableEvent;
        let existingEventEncodedId: string;
        const existingTimestamp = new Date('2024-01-01');

        beforeEach(() => {
            mockUser = createMockUserWithRelations();
            existingEventToUpdate = createMockLoggableEvent({
                name: 'Go on a walk',
                userId: mockUser.id,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
                warningThresholdInDays: 7,
                timestamps: [existingTimestamp]
            });
            existingEventEncodedId = encodeEventId(existingEventToUpdate.id);
        });

        it('should add timestamp successfully', async () => {
            const newTimestamp = new Date('2024-01-02');

            const updatedEvent = {
                ...existingEventToUpdate,
                timestamps: [newTimestamp, existingTimestamp]
            };

            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(existingEventToUpdate);
            // Mock for fetching current timestamps
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(existingEventToUpdate);
            // Mock for updating the event with new timestamps
            prismaMock.loggableEvent.update.mockResolvedValue(updatedEvent);

            const { data, errors } = await client.request(
                ADD_TIMESTAMP_TO_EVENT,
                {
                    input: {
                        id: existingEventEncodedId,
                        timestamp: newTimestamp.toISOString()
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.addTimestampToEvent.loggableEvent.timestamps).toEqual([
                newTimestamp.toISOString(),
                existingTimestamp.toISOString()
            ]);
            expect(data.addTimestampToEvent.errors).toEqual([]);

            expect(prismaMock.loggableEvent.update).toHaveBeenCalledWith({
                where: { id: existingEventToUpdate.id },
                data: { timestamps: { set: [newTimestamp, existingTimestamp] } },
                include: { labels: true }
            });
        });

        it('should handle adding duplicate timestamp', async () => {
            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(existingEventToUpdate);
            // Mock for fetching current timestamps
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(existingEventToUpdate);
            // Mock for updating the event with new timestamps
            prismaMock.loggableEvent.update.mockResolvedValue(existingEventToUpdate);

            const { data, errors } = await client.request(
                ADD_TIMESTAMP_TO_EVENT,
                {
                    input: {
                        id: existingEventEncodedId,
                        timestamp: existingTimestamp.toISOString()
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.addTimestampToEvent.loggableEvent.timestamps).toEqual([existingTimestamp.toISOString()]);
            expect(data.addTimestampToEvent.errors).toEqual([]);
        });

        it('should return internal error when database fails during timestamp retrieval', async () => {
            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(existingEventToUpdate);
            // Mock database failure when fetching current timestamps
            prismaMock.loggableEvent.findUnique.mockRejectedValueOnce(new Error('Database connection failed'));

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                ADD_TIMESTAMP_TO_EVENT,
                {
                    input: {
                        id: existingEventEncodedId,
                        timestamp: new Date('2024-01-01').toISOString()
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            // Masked error in GraphQL response
            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            // Verify that update was not called
            expect(prismaMock.loggableEvent.update).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('removeTimestampFromEvent mutation', () => {
        const REMOVE_TIMESTAMP_FROM_EVENT = `
            mutation RemoveTimestampFromEvent($input: RemoveTimestampFromEventMutationInput!) {
                removeTimestampFromEvent(input: $input) {
                    loggableEvent {
                        id
                        name
                        timestamps
                    }
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        let mockUser: UserParent;

        beforeEach(() => {
            mockUser = createMockUserWithRelations();
        });

        it('should remove timestamp successfully', async () => {
            const timestamp1 = new Date('2024-01-01');
            const timestamp2 = new Date('2024-01-02');
            const mockEvent = createMockLoggableEvent({
                timestamps: [timestamp2, timestamp1],
                userId: mockUser.id
            });
            const updatedEvent = {
                ...mockEvent,
                timestamps: [timestamp2]
            };

            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(mockEvent);
            // Mock for fetching current timestamps
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(mockEvent);
            // Mock for updating the event with new timestamps
            prismaMock.loggableEvent.update.mockResolvedValue(updatedEvent);

            const { data, errors } = await client.request(
                REMOVE_TIMESTAMP_FROM_EVENT,
                {
                    input: {
                        id: encodeEventId(mockEvent.id),
                        timestamp: timestamp1.toISOString()
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.removeTimestampFromEvent.loggableEvent.timestamps).toEqual([timestamp2.toISOString()]);
            expect(data.removeTimestampFromEvent.errors).toEqual([]);

            expect(prismaMock.loggableEvent.update).toHaveBeenCalledWith({
                where: { id: mockEvent.id },
                data: { timestamps: { set: [timestamp2] } },
                include: { labels: true }
            });
        });

        it('should return error when timestamp not found', async () => {
            const existingTimestamp = new Date('2024-01-01');
            const notFoundTimestamp = new Date('2024-01-02');
            const mockEvent = createMockLoggableEvent({
                timestamps: [existingTimestamp],
                userId: mockUser.id
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(mockEvent);
            // Mock for fetching current timestamps
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(mockEvent);

            const { data, errors } = await client.request(
                REMOVE_TIMESTAMP_FROM_EVENT,
                {
                    input: {
                        id: encodeEventId(mockEvent.id),
                        timestamp: notFoundTimestamp.toISOString()
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.removeTimestampFromEvent.errors).toEqual([
                {
                    code: 'NOT_FOUND',
                    field: 'timestamp',
                    message: 'Timestamp not found'
                }
            ]);
            expect(data.removeTimestampFromEvent.loggableEvent).toBeNull();
            expect(prismaMock.loggableEvent.update).not.toHaveBeenCalled();
        });

        it('should return internal error when database fails during timestamp retrieval', async () => {
            const mockEvent = createMockLoggableEvent({
                userId: mockUser.id
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.loggableEvent.findUnique.mockResolvedValueOnce(mockEvent);
            // Mock database failure when fetching current timestamps
            prismaMock.loggableEvent.findUnique.mockRejectedValueOnce(new Error('Database connection failed'));

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                REMOVE_TIMESTAMP_FROM_EVENT,
                {
                    input: {
                        id: encodeEventId(mockEvent.id),
                        timestamp: new Date('2024-01-01').toISOString()
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            // Masked error in GraphQL response
            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            // Verify that update was not called
            expect(prismaMock.loggableEvent.update).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });
});
