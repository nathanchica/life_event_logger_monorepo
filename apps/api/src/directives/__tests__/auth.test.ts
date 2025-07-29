import { GraphQLError } from 'graphql';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockContext } from '../../mocks/context.js';
import prismaMock from '../../prisma/__mocks__/client.js';
import { createMockEventLabel } from '../../schema/eventLabel/__mocks__/eventLabel.js';
import { createMockLoggableEvent } from '../../schema/loggableEvent/__mocks__/loggableEvent.js';
import { createMockUserWithRelations } from '../../schema/user/__mocks__/user.js';
import { validateResourceOwnership } from '../auth.js';

describe('validateResourceOwnership', () => {
    let mockContext: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        mockContext = createMockContext();
    });

    describe('Authentication checks', () => {
        it('should throw UNAUTHORIZED error when user is not authenticated', async () => {
            await expect(validateResourceOwnership(mockContext, 'loggableEvent', 'event-123')).rejects.toMatchObject({
                message: 'User not authenticated',
                extensions: { code: 'UNAUTHORIZED' }
            });
        });
    });

    describe('LoggableEvent ownership validation', () => {
        it('should pass when user owns the loggableEvent', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const mockEvent = createMockLoggableEvent({
                id: 'event-123',
                userId: 'user-123'
            });

            mockContext = createMockContext({ user: mockUser });
            prismaMock.loggableEvent.findUnique.mockResolvedValue(mockEvent);

            // should not throw
            await expect(validateResourceOwnership(mockContext, 'loggableEvent', 'event-123')).resolves.toBeUndefined();

            // Verify correct database call
            expect(prismaMock.loggableEvent.findUnique).toHaveBeenCalledWith({
                where: { id: 'event-123' },
                select: { userId: true }
            });
        });

        it('should throw NOT_FOUND error when loggableEvent does not exist', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            mockContext = createMockContext({ user: mockUser });
            prismaMock.loggableEvent.findUnique.mockResolvedValue(null);

            await expect(validateResourceOwnership(mockContext, 'loggableEvent', 'event-123')).rejects.toMatchObject({
                message: 'loggableEvent not found',
                extensions: { code: 'NOT_FOUND' }
            });
        });

        it('should throw FORBIDDEN error when user does not own the loggableEvent', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const mockEvent = createMockLoggableEvent({
                id: 'event-456',
                userId: 'other-user-456'
            });

            mockContext = createMockContext({ user: mockUser });
            prismaMock.loggableEvent.findUnique.mockResolvedValue(mockEvent);

            await expect(validateResourceOwnership(mockContext, 'loggableEvent', 'event-456')).rejects.toMatchObject({
                message: 'You do not have permission to access this loggableEvent',
                extensions: { code: 'FORBIDDEN' }
            });
        });
    });

    describe('EventLabel ownership validation', () => {
        it('should pass when user owns the eventLabel', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const mockLabel = createMockEventLabel({
                id: 'label-123',
                userId: 'user-123'
            });

            mockContext = createMockContext({ user: mockUser });
            prismaMock.eventLabel.findUnique.mockResolvedValue(mockLabel);

            // should not throw
            await expect(validateResourceOwnership(mockContext, 'eventLabel', 'label-123')).resolves.toBeUndefined();

            // Verify correct database call
            expect(prismaMock.eventLabel.findUnique).toHaveBeenCalledWith({
                where: { id: 'label-123' },
                select: { userId: true }
            });
        });

        it('should throw NOT_FOUND error when eventLabel does not exist', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            mockContext = createMockContext({ user: mockUser });
            prismaMock.eventLabel.findUnique.mockResolvedValue(null);

            await expect(validateResourceOwnership(mockContext, 'eventLabel', 'label-123')).rejects.toMatchObject({
                message: 'eventLabel not found',
                extensions: { code: 'NOT_FOUND' }
            });
        });

        it('should throw FORBIDDEN error when user does not own the eventLabel', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            const mockLabel = createMockEventLabel({
                id: 'label-456',
                userId: 'other-user-456'
            });

            mockContext = createMockContext({ user: mockUser });
            prismaMock.eventLabel.findUnique.mockResolvedValue(mockLabel);

            await expect(validateResourceOwnership(mockContext, 'eventLabel', 'label-456')).rejects.toMatchObject({
                message: 'You do not have permission to access this eventLabel',
                extensions: { code: 'FORBIDDEN' }
            });
        });
    });

    describe('Error handling', () => {
        it('should throw INTERNAL_ERROR for unknown resource type', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            mockContext = createMockContext({ user: mockUser });

            await expect(
                // Forcing an error by passing an unknown resource type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                validateResourceOwnership(mockContext, 'unknownResource' as any, 'resource-123')
            ).rejects.toMatchObject({
                message: 'Unknown resource type: unknownResource',
                extensions: { code: 'INTERNAL_ERROR' }
            });
        });

        it('should log and throw normal Error for non-GraphQL errors', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            mockContext = createMockContext({ user: mockUser });

            // Mock database failure
            const dbError = new Error('Database connection failed');
            prismaMock.loggableEvent.findUnique.mockRejectedValue(dbError);

            // Spy on console.error
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(validateResourceOwnership(mockContext, 'loggableEvent', 'event-123')).rejects.toThrow(
                'Failed to verify resource ownership'
            );

            // Verify console.error was called with the original error
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to verify resource ownership:', dbError);

            consoleErrorSpy.mockRestore();
        });

        it('should rethrow GraphQL errors without wrapping', async () => {
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            mockContext = createMockContext({ user: mockUser });

            // Mock a GraphQL error from the database layer
            const graphqlError = new GraphQLError('Custom GraphQL error', {
                extensions: { code: 'CUSTOM_ERROR' }
            });
            prismaMock.eventLabel.findUnique.mockRejectedValue(graphqlError);

            await expect(validateResourceOwnership(mockContext, 'eventLabel', 'label-123')).rejects.toMatchObject({
                message: 'Custom GraphQL error',
                extensions: { code: 'CUSTOM_ERROR' }
            });
        });
    });
});
