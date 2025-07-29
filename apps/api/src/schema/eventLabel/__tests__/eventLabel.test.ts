import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestClient, TestGraphQLClient } from '../../../mocks/client.js';
import prismaMock from '../../../prisma/__mocks__/client.js';
import { createMockUserWithRelations } from '../../user/__mocks__/user.js';
import { createMockEventLabel } from '../__mocks__/eventLabel.js';
import { MAX_EVENT_LABEL_NAME_LENGTH } from '../index.js';

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
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com'
            });
            const mockLabel = createMockEventLabel({
                id: 'label-123',
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
                    id: 'label-123',
                    name: 'Work',
                    createdAt: mockLabel.createdAt.toISOString(),
                    updatedAt: mockLabel.updatedAt.toISOString(),
                    user: {
                        id: 'user-123',
                        name: 'Test User',
                        email: 'test@example.com'
                    }
                },
                errors: []
            });

            expect(prismaMock.eventLabel.findFirst).toHaveBeenCalledWith({
                where: {
                    name: 'Work',
                    userId: 'user-123'
                }
            });

            expect(prismaMock.eventLabel.create).toHaveBeenCalledWith({
                data: {
                    name: 'Work',
                    userId: 'user-123'
                }
            });

            // Verify the EventLabel.user resolver was called
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' }
            });
        });

        it('should return error when label name already exists', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const existingLabel = createMockEventLabel({
                id: 'existing-label',
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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });

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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });

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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const mockLabel = createMockEventLabel({
                id: 'label-123',
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
                where: { id: 'user-123' }
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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const updatedLabel = createMockEventLabel({
                id: 'label-123',
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
                        id: 'label-123',
                        name: 'Personal'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateEventLabel).toEqual({
                eventLabel: {
                    id: 'label-123',
                    name: 'Personal',
                    createdAt: updatedLabel.createdAt.toISOString(),
                    updatedAt: updatedLabel.updatedAt.toISOString()
                },
                errors: []
            });

            expect(prismaMock.eventLabel.update).toHaveBeenCalledWith({
                where: { id: 'label-123' },
                data: { name: 'Personal' }
            });
        });

        it('should return error when new name already exists', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const existingLabel = createMockEventLabel({
                id: 'other-label',
                name: 'Personal',
                userId: mockUser.id
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(
                createMockEventLabel({ id: 'label-123', name: 'OldName', userId: mockUser.id })
            );
            // Mock for checking if new name already exists (returns existing label)
            prismaMock.eventLabel.findFirst.mockResolvedValue(existingLabel);

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                {
                    input: {
                        id: 'label-123',
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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const existingLabel = createMockEventLabel({
                id: 'label-123',
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
                        id: 'label-123'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateEventLabel).toEqual({
                eventLabel: {
                    id: 'label-123',
                    name: 'Work',
                    createdAt: existingLabel.createdAt.toISOString(),
                    updatedAt: existingLabel.updatedAt.toISOString()
                },
                errors: []
            });

            expect(prismaMock.eventLabel.findFirst).not.toHaveBeenCalled();
            expect(prismaMock.eventLabel.update).toHaveBeenCalledWith({
                where: { id: 'label-123' },
                data: {}
            });
        });

        it.each([
            {
                scenario: 'empty name',
                input: { id: 'label-123', name: '' },
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: 'Name cannot be empty'
                }
            },
            {
                scenario: 'name too long',
                input: { id: 'label-123', name: 'a'.repeat(MAX_EVENT_LABEL_NAME_LENGTH + 1) },
                expectedError: {
                    code: 'VALIDATION_ERROR',
                    field: 'name',
                    message: `Name must be under ${MAX_EVENT_LABEL_NAME_LENGTH} characters`
                }
            }
        ])('should return validation error for $scenario in update', async ({ input, expectedError }) => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const existingLabel = createMockEventLabel({
                id: 'label-123',
                name: 'Work',
                userId: mockUser.id
            });

            // Mock for @requireOwner directive - checking ownership
            prismaMock.eventLabel.findUnique.mockResolvedValue(existingLabel);

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                { input },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.updateEventLabel.errors).toEqual([expectedError]);
            expect(data.updateEventLabel.eventLabel).toBeNull();
            expect(prismaMock.eventLabel.update).not.toHaveBeenCalled();
        });

        it('should return internal error when database fails during update', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const existingLabel = createMockEventLabel({
                id: 'label-123',
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
                        id: 'label-123',
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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const otherUserLabel = createMockEventLabel({
                id: 'label-456',
                name: 'OtherWork',
                userId: 'other-user-456'
            });

            // Mock for @requireOwner directive - returns label with different userId
            prismaMock.eventLabel.findUnique.mockResolvedValue(otherUserLabel);

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                UPDATE_EVENT_LABEL,
                {
                    input: {
                        id: 'label-456',
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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const deletedLabel = createMockEventLabel({
                id: 'label-123',
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
                        id: 'label-123'
                    }
                },
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.deleteEventLabel).toEqual({
                eventLabel: {
                    id: 'label-123',
                    name: 'Work'
                },
                errors: []
            });

            expect(prismaMock.eventLabel.delete).toHaveBeenCalledWith({
                where: { id: 'label-123' }
            });
        });

        it('should return validation error for empty ID', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });

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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const labelToDelete = createMockEventLabel({
                id: 'label-123',
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
                        id: 'label-123'
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
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const otherUserLabel = createMockEventLabel({
                id: 'label-789',
                name: 'OtherLabel',
                userId: 'other-user-789'
            });

            // Mock for @requireOwner directive - returns label with different userId
            prismaMock.eventLabel.findUnique.mockResolvedValue(otherUserLabel);

            // Mock console.error to suppress expected error output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                DELETE_EVENT_LABEL,
                {
                    input: {
                        id: 'label-789'
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
