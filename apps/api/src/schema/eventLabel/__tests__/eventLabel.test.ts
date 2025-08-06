import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestClient, TestGraphQLClient } from '../../../mocks/client.js';
import prismaMock from '../../../prisma/__mocks__/client.js';
import { getIdEncoder } from '../../../utils/encoder.js';
import { createMockUserWithRelations } from '../../user/__mocks__/user.js';
import { createMockEventLabel } from '../__mocks__/eventLabel.js';
import { MAX_EVENT_LABEL_NAME_LENGTH } from '../index.js';

// Helper to encode user ID for expected responses
const encodeUserId = (userId: string): string => {
    const encoder = getIdEncoder();
    return encoder.encode(userId, 'user');
};

// Helper to encode label ID for expected responses
const encodeLabelId = (labelId: string): string => {
    const encoder = getIdEncoder();
    return encoder.encode(labelId, 'eventLabel');
};

describe('EventLabel GraphQL', () => {
    let client: TestGraphQLClient;

    beforeEach(() => {
        client = createTestClient();
    });

    describe('createEventLabel mutation', () => {
        const CREATE_EVENT_LABEL = `
            mutation CreateEventLabel($input: CreateEventLabelMutationInput!) {
                createEventLabel(input: $input) {
                    tempID
                    eventLabel {
                        id
                        name
                        createdAt
                        updatedAt
                        user {
                            id
                            name
                            email
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

        it('should create a new event label successfully', async () => {
            const mockUser = createMockUserWithRelations({
                name: 'Test User',
                email: 'test@example.com'
            });
            const mockLabel = createMockEventLabel({
                name: 'Work',
                userId: mockUser.id,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            });

            // Mock for checking if label name already exists
            prismaMock.eventLabel.findFirst.mockResolvedValue(null);
            // Mock for creating the label
            prismaMock.eventLabel.create.mockResolvedValue(mockLabel);
            // Mock for EventLabel.user field resolver
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            const { data, errors } = await client.request(
                CREATE_EVENT_LABEL,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Work'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.createEventLabel).toEqual({
                tempID: 'temp-123',
                eventLabel: {
                    id: encodeLabelId(mockLabel.id),
                    name: 'Work',
                    createdAt: mockLabel.createdAt.toISOString(),
                    updatedAt: mockLabel.updatedAt.toISOString(),
                    user: {
                        id: encodeUserId(mockUser.id),
                        name: 'Test User',
                        email: 'test@example.com'
                    }
                },
                errors: []
            });

            expect(prismaMock.eventLabel.findFirst).toHaveBeenCalledWith({
                where: {
                    name: 'Work',
                    userId: mockUser.id
                }
            });

            expect(prismaMock.eventLabel.create).toHaveBeenCalledWith({
                data: {
                    name: 'Work',
                    userId: mockUser.id
                }
            });

            // Verify the EventLabel.user resolver was called
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockUser.id }
            });
        });

        it('should return error when label name already exists', async () => {
            const mockUser = createMockUserWithRelations();
            const existingLabel = createMockEventLabel({
                name: 'Work',
                userId: mockUser.id
            });

            // Mock for checking if label name already exists (returns existing label)
            prismaMock.eventLabel.findFirst.mockResolvedValue(existingLabel);

            const { data, errors } = await client.request(
                CREATE_EVENT_LABEL,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Work'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.createEventLabel).toEqual({
                tempID: 'temp-123',
                eventLabel: null,
                errors: [
                    {
                        code: 'VALIDATION_ERROR',
                        field: 'name',
                        message: 'A label with this name already exists'
                    }
                ]
            });

            expect(prismaMock.eventLabel.create).not.toHaveBeenCalled();
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
                name: 'a'.repeat(MAX_EVENT_LABEL_NAME_LENGTH + 1),
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: `Name must be under ${MAX_EVENT_LABEL_NAME_LENGTH} characters`
                }
            }
        ])('should return validation error for $scenario', async ({ name, expectedError }) => {
            const mockUser = createMockUserWithRelations();

            const { data, errors } = await client.request(
                CREATE_EVENT_LABEL,
                {
                    input: {
                        id: 'temp-123',
                        name
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.createEventLabel.errors).toEqual([expectedError]);
            expect(data.createEventLabel.eventLabel).toBeNull();
            expect(prismaMock.eventLabel.create).not.toHaveBeenCalled();
        });

        it('should return internal error when database fails', async () => {
            const mockUser = createMockUserWithRelations();

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Mock database failure when checking if label name exists
            prismaMock.eventLabel.findFirst.mockRejectedValue(new Error('Database connection failed'));

            const { data, errors } = await client.request(
                CREATE_EVENT_LABEL,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Work'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();
            expect(prismaMock.eventLabel.create).not.toHaveBeenCalled();

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });

        it('should throw error when user does not exist for EventLabel.user resolver', async () => {
            const mockUser = createMockUserWithRelations();
            const mockLabel = createMockEventLabel({
                name: 'Work',
                userId: mockUser.id,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            });

            // Mock for checking if label name already exists
            prismaMock.eventLabel.findFirst.mockResolvedValue(null);
            // Mock for creating the label
            prismaMock.eventLabel.create.mockResolvedValue(mockLabel);
            // Mock for EventLabel.user field resolver - returns null to trigger NOT_FOUND error
            prismaMock.user.findUnique.mockResolvedValue(null);

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                CREATE_EVENT_LABEL,
                {
                    input: {
                        id: 'temp-123',
                        name: 'Work'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('NOT_FOUND');
            expect(errors[0].path).toEqual(['createEventLabel', 'eventLabel', 'user']);
            // When a field resolver throws an error, GraphQL sets the parent object to null
            expect(data.createEventLabel.tempID).toBe('temp-123');
            expect(data.createEventLabel.errors).toEqual([]);
            expect(data.createEventLabel.eventLabel).toBeNull();

            // Verify the EventLabel.user resolver was called
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockUser.id }
            });

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });
    });

    describe('updateEventLabel mutation', () => {
        const UPDATE_EVENT_LABEL = `
            mutation UpdateEventLabel($input: UpdateEventLabelMutationInput!) {
                updateEventLabel(input: $input) {
                    eventLabel {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        it('should update event label name successfully', async () => {
            const mockUser = createMockUserWithRelations();
            const updatedLabel = createMockEventLabel({
                name: 'Personal',
                userId: mockUser.id,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02')
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(updatedLabel);
            // Mock for checking if new name already exists
            prismaMock.eventLabel.findFirst.mockResolvedValue(null);
            // Mock for updating the label
            prismaMock.eventLabel.update.mockResolvedValue(updatedLabel);

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                {
                    input: {
                        id: encodeLabelId(updatedLabel.id),
                        name: 'Personal'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateEventLabel).toEqual({
                eventLabel: {
                    id: encodeLabelId(updatedLabel.id),
                    name: 'Personal',
                    createdAt: updatedLabel.createdAt.toISOString(),
                    updatedAt: updatedLabel.updatedAt.toISOString()
                },
                errors: []
            });

            expect(prismaMock.eventLabel.update).toHaveBeenCalledWith({
                where: { id: updatedLabel.id },
                data: { name: 'Personal' }
            });
        });

        it('should return error when new name already exists', async () => {
            const mockUser = createMockUserWithRelations();
            const existingLabel = createMockEventLabel({
                name: 'Personal',
                userId: mockUser.id
            });

            const labelToUpdate = createMockEventLabel({
                name: 'OldName',
                userId: mockUser.id
            });
            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(labelToUpdate);
            // Mock for checking if new name already exists (returns existing label)
            prismaMock.eventLabel.findFirst.mockResolvedValue(existingLabel);

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                {
                    input: {
                        id: encodeLabelId(labelToUpdate.id),
                        name: 'Personal'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateEventLabel).toEqual({
                eventLabel: null,
                errors: [
                    {
                        code: 'VALIDATION_ERROR',
                        field: 'name',
                        message: 'A label with this name already exists'
                    }
                ]
            });

            expect(prismaMock.eventLabel.update).not.toHaveBeenCalled();
        });

        it('should handle update with no name change', async () => {
            const mockUser = createMockUserWithRelations();
            const existingLabel = createMockEventLabel({
                name: 'Work',
                userId: mockUser.id,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(existingLabel);
            // Mock for updating the label (no actual changes)
            prismaMock.eventLabel.update.mockResolvedValue(existingLabel);

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                {
                    input: {
                        id: encodeLabelId(existingLabel.id)
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateEventLabel).toEqual({
                eventLabel: {
                    id: encodeLabelId(existingLabel.id),
                    name: 'Work',
                    createdAt: existingLabel.createdAt.toISOString(),
                    updatedAt: existingLabel.updatedAt.toISOString()
                },
                errors: []
            });

            expect(prismaMock.eventLabel.findFirst).not.toHaveBeenCalled();
            expect(prismaMock.eventLabel.update).toHaveBeenCalledWith({
                where: { id: existingLabel.id },
                data: {}
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
                name: 'a'.repeat(MAX_EVENT_LABEL_NAME_LENGTH + 1),
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: `Name must be under ${MAX_EVENT_LABEL_NAME_LENGTH} characters`
                }
            }
        ])('should return validation error for $scenario in update', async ({ name, expectedError }) => {
            const mockUser = createMockUserWithRelations();
            const existingLabel = createMockEventLabel({
                name: 'Work',
                userId: mockUser.id
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(existingLabel);

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                { input: { id: encodeLabelId(existingLabel.id), name } },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateEventLabel.errors).toEqual([expectedError]);
            expect(data.updateEventLabel.eventLabel).toBeNull();
            expect(prismaMock.eventLabel.update).not.toHaveBeenCalled();
        });

        it('should return internal error when database fails during update', async () => {
            const mockUser = createMockUserWithRelations();
            const existingLabel = createMockEventLabel({
                name: 'Work',
                userId: mockUser.id
            });

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(existingLabel);
            // Mock database failure during update operation
            prismaMock.eventLabel.update.mockRejectedValue(new Error('Database connection failed'));

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                {
                    input: {
                        id: encodeLabelId(existingLabel.id),
                        name: 'Personal'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });

        it('should return auth error when trying to update label owned by another user', async () => {
            const mockUser = createMockUserWithRelations();
            const otherUser = createMockUserWithRelations();
            const otherUserLabel = createMockEventLabel({
                name: 'OtherWork',
                userId: otherUser.id
            });

            // Mock for @requireOwner directive - returns label with different userId
            prismaMock.eventLabel.findUnique.mockResolvedValue(otherUserLabel);

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                {
                    input: {
                        id: encodeLabelId(otherUserLabel.id),
                        name: 'NewName'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('FORBIDDEN');
            expect(data).toBeNull();

            expect(prismaMock.eventLabel.update).not.toHaveBeenCalled();

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });
    });

    describe('deleteEventLabel mutation', () => {
        const DELETE_EVENT_LABEL = `
            mutation DeleteEventLabel($input: DeleteEventLabelMutationInput!) {
                deleteEventLabel(input: $input) {
                    eventLabel {
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

        it('should delete event label successfully', async () => {
            const mockUser = createMockUserWithRelations();
            const deletedLabel = createMockEventLabel({
                name: 'Work',
                userId: mockUser.id
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(deletedLabel);
            // Mock for deleting the label
            prismaMock.eventLabel.delete.mockResolvedValue(deletedLabel);

            const { data, errors } = await client.request(
                DELETE_EVENT_LABEL,
                {
                    input: {
                        id: encodeLabelId(deletedLabel.id)
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.deleteEventLabel).toEqual({
                eventLabel: {
                    id: encodeLabelId(deletedLabel.id),
                    name: 'Work'
                },
                errors: []
            });

            expect(prismaMock.eventLabel.delete).toHaveBeenCalledWith({
                where: { id: deletedLabel.id }
            });
        });

        it('should return validation error for empty ID', async () => {
            const mockUser = createMockUserWithRelations();

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                DELETE_EVENT_LABEL,
                {
                    input: {
                        id: ''
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            // The @requireOwner directive validates the ID before the resolver runs
            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('VALIDATION_ERROR');
            expect(data).toBeNull();
            expect(prismaMock.eventLabel.delete).not.toHaveBeenCalled();

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });

        it('should return internal error when database fails during delete', async () => {
            const mockUser = createMockUserWithRelations();
            const labelToDelete = createMockEventLabel({
                name: 'Work',
                userId: mockUser.id
            });

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(labelToDelete);
            // Mock database failure during delete operation
            prismaMock.eventLabel.delete.mockRejectedValue(new Error('Database connection failed'));

            const { data, errors } = await client.request(
                DELETE_EVENT_LABEL,
                {
                    input: {
                        id: encodeLabelId(labelToDelete.id)
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });

        it('should return auth error when trying to delete label owned by another user', async () => {
            const mockUser = createMockUserWithRelations();
            const otherUser = createMockUserWithRelations();
            const otherUserLabel = createMockEventLabel({
                name: 'OtherLabel',
                userId: otherUser.id
            });

            // Mock for @requireOwner directive - returns label with different userId
            prismaMock.eventLabel.findUnique.mockResolvedValue(otherUserLabel);

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                DELETE_EVENT_LABEL,
                {
                    input: {
                        id: encodeLabelId(otherUserLabel.id)
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('FORBIDDEN');
            expect(data).toBeNull();

            expect(prismaMock.eventLabel.delete).not.toHaveBeenCalled();

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });
    });
});
