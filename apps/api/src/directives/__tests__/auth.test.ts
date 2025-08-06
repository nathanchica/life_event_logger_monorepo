import { GraphQLError } from 'graphql';
import { describe, it, expect, vi } from 'vitest';

import prismaMock from '../../prisma/__mocks__/client.js';
import { createMockEventLabel } from '../../schema/eventLabel/__mocks__/eventLabel.js';
import { createMockLoggableEvent } from '../../schema/loggableEvent/__mocks__/loggableEvent.js';
import { createMockUserWithRelations } from '../../schema/user/__mocks__/user.js';
import { getIdEncoder } from '../../utils/encoder.js';
import { validateResourceOwnership, processAuthDirectiveArgs, ResourceArgs } from '../auth.js';

// Initialize encoder for use in tests
const encoder = getIdEncoder();

describe('validateResourceOwnership', () => {
    describe('LoggableEvent ownership validation', () => {
        it('should pass when user owns the loggableEvent', async () => {
            const mockUser = createMockUserWithRelations();
            const mockEvent = createMockLoggableEvent({
                userId: mockUser.id
            });

            prismaMock.loggableEvent.findUnique.mockResolvedValue(mockEvent);

            // should not throw
            await expect(
                validateResourceOwnership(mockUser, prismaMock, 'loggableEvent', mockEvent.id)
            ).resolves.toBeUndefined();

            // Verify correct database call with decoded ID
            expect(prismaMock.loggableEvent.findUnique).toHaveBeenCalledWith({
                where: { id: mockEvent.id },
                select: { userId: true }
            });
        });

        it('should throw NOT_FOUND error when loggableEvent does not exist', async () => {
            const mockUser = createMockUserWithRelations();
            const mockEvent = createMockLoggableEvent();

            prismaMock.loggableEvent.findUnique.mockResolvedValue(null);

            await expect(
                validateResourceOwnership(mockUser, prismaMock, 'loggableEvent', mockEvent.id)
            ).rejects.toMatchObject({
                message: 'loggableEvent not found',
                extensions: { code: 'NOT_FOUND' }
            });
        });

        it('should throw FORBIDDEN error when user does not own the loggableEvent', async () => {
            const mockUser = createMockUserWithRelations();
            const otherUser = createMockUserWithRelations();
            const mockEvent = createMockLoggableEvent({
                userId: otherUser.id
            });

            prismaMock.loggableEvent.findUnique.mockResolvedValue(mockEvent);

            await expect(
                validateResourceOwnership(mockUser, prismaMock, 'loggableEvent', mockEvent.id)
            ).rejects.toMatchObject({
                message: 'You do not have permission to access this loggableEvent',
                extensions: { code: 'FORBIDDEN' }
            });
        });
    });

    describe('EventLabel ownership validation', () => {
        it('should pass when user owns the eventLabel', async () => {
            const mockUser = createMockUserWithRelations();
            const mockLabel = createMockEventLabel({
                userId: mockUser.id
            });

            prismaMock.eventLabel.findUnique.mockResolvedValue(mockLabel);

            // should not throw
            await expect(
                validateResourceOwnership(mockUser, prismaMock, 'eventLabel', mockLabel.id)
            ).resolves.toBeUndefined();

            // Verify correct database call with decoded ID
            expect(prismaMock.eventLabel.findUnique).toHaveBeenCalledWith({
                where: { id: mockLabel.id },
                select: { userId: true }
            });
        });

        it('should throw NOT_FOUND error when eventLabel does not exist', async () => {
            const mockUser = createMockUserWithRelations();
            const mockLabel = createMockEventLabel();

            prismaMock.eventLabel.findUnique.mockResolvedValue(null);

            await expect(
                validateResourceOwnership(mockUser, prismaMock, 'eventLabel', mockLabel.id)
            ).rejects.toMatchObject({
                message: 'eventLabel not found',
                extensions: { code: 'NOT_FOUND' }
            });
        });

        it('should throw FORBIDDEN error when user does not own the eventLabel', async () => {
            const mockUser = createMockUserWithRelations();
            const otherUser = createMockUserWithRelations();
            const mockLabel = createMockEventLabel({
                userId: otherUser.id
            });

            prismaMock.eventLabel.findUnique.mockResolvedValue(mockLabel);

            await expect(
                validateResourceOwnership(mockUser, prismaMock, 'eventLabel', mockLabel.id)
            ).rejects.toMatchObject({
                message: 'You do not have permission to access this eventLabel',
                extensions: { code: 'FORBIDDEN' }
            });
        });
    });

    describe('Error handling', () => {
        it('should throw INTERNAL_ERROR for unknown resource type', async () => {
            const mockUser = createMockUserWithRelations();
            const mockEvent = createMockLoggableEvent();

            await expect(
                // Forcing an error by passing an unknown resource type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                validateResourceOwnership(mockUser, prismaMock, 'unknownResource' as any, mockEvent.id)
            ).rejects.toMatchObject({
                message: 'Unknown resource type: unknownResource',
                extensions: { code: 'INTERNAL_ERROR' }
            });
        });

        it('should log and throw normal Error for non-GraphQL errors', async () => {
            const mockUser = createMockUserWithRelations();
            const mockEvent = createMockLoggableEvent();

            // Mock database failure
            const dbError = new Error('Database connection failed');
            prismaMock.loggableEvent.findUnique.mockRejectedValue(dbError);

            // Spy on console.error
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(
                validateResourceOwnership(mockUser, prismaMock, 'loggableEvent', mockEvent.id)
            ).rejects.toThrow('Failed to verify resource ownership');

            // Verify console.error was called with the original error
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to verify resource ownership:', dbError);

            consoleErrorSpy.mockRestore();
        });

        it('should rethrow GraphQL errors without wrapping', async () => {
            const mockUser = createMockUserWithRelations();
            const mockLabel = createMockEventLabel();

            // Mock a GraphQL error from the database layer
            const graphqlError = new GraphQLError('Custom GraphQL error', {
                extensions: { code: 'CUSTOM_ERROR' }
            });
            prismaMock.eventLabel.findUnique.mockRejectedValue(graphqlError);

            await expect(
                validateResourceOwnership(mockUser, prismaMock, 'eventLabel', mockLabel.id)
            ).rejects.toMatchObject({
                message: 'Custom GraphQL error',
                extensions: { code: 'CUSTOM_ERROR' }
            });
        });
    });
});

describe('processAuthDirectiveArgs', () => {
    describe('Resource type validation', () => {
        it.each([
            {
                resourceType: 'loggableEvent',
                createMock: () => createMockLoggableEvent(),
                encodeType: 'loggableEvent' as const
            },
            {
                resourceType: 'eventLabel',
                createMock: () => createMockEventLabel(),
                encodeType: 'eventLabel' as const
            }
        ])('should accept valid resource type "$resourceType"', ({ resourceType, createMock, encodeType }) => {
            const mockResource = createMock();
            const encodedId = encoder.encode(mockResource.id, encodeType);
            const args = { id: encodedId };

            const result = processAuthDirectiveArgs(resourceType, args);

            expect(result).toEqual({
                resourceType,
                resourceId: mockResource.id
            });
        });

        it.each([
            {
                scenario: 'unknown resource type',
                resourceType: 'unknownResource',
                expectedMessage: 'Unknown resource type: unknownResource'
            },
            {
                scenario: 'empty resource type',
                resourceType: '',
                expectedMessage: 'Unknown resource type: '
            }
        ])('should throw INTERNAL_ERROR for $scenario', ({ resourceType, expectedMessage }) => {
            const mockEvent = createMockLoggableEvent();
            const encodedId = encoder.encode(mockEvent.id, 'loggableEvent');
            const args = { id: encodedId };

            expect(() => processAuthDirectiveArgs(resourceType, args)).toThrowError(
                new GraphQLError(expectedMessage, {
                    extensions: { code: 'INTERNAL_ERROR' }
                })
            );
        });
    });

    describe('Resource ID extraction', () => {
        it.each([
            {
                scenario: 'ID from args.id',
                resourceType: 'loggableEvent' as const,
                createMock: () => createMockLoggableEvent(),
                buildArgs: (encodedId: string) => ({ id: encodedId })
            },
            {
                scenario: 'ID from args.input.id',
                resourceType: 'eventLabel' as const,
                createMock: () => createMockEventLabel(),
                buildArgs: (encodedId: string) => ({ input: { id: encodedId } })
            }
        ])('should extract $scenario', ({ resourceType, createMock, buildArgs }) => {
            const mockResource = createMock();
            const encodedId = encoder.encode(mockResource.id, resourceType);
            const args = buildArgs(encodedId);

            const result = processAuthDirectiveArgs(resourceType, args);

            expect(result.resourceId).toBe(mockResource.id);
        });

        it('should prefer args.input.id over args.id when both present', () => {
            const mockEvent1 = createMockLoggableEvent();
            const mockEvent2 = createMockLoggableEvent();
            const encodedId1 = encoder.encode(mockEvent1.id, 'loggableEvent');
            const encodedId2 = encoder.encode(mockEvent2.id, 'loggableEvent');
            const args = {
                input: { id: encodedId1 },
                id: encodedId2
            };

            const result = processAuthDirectiveArgs('loggableEvent', args);

            expect(result.resourceId).toBe(mockEvent1.id);
        });

        it.each([
            {
                scenario: 'no ID is provided',
                resourceType: 'loggableEvent',
                args: {},
                expectedMessage: 'Resource ID is required for loggableEvent ownership check'
            },
            {
                scenario: 'ID is null',
                resourceType: 'eventLabel',
                args: { id: null },
                expectedMessage: 'Resource ID is required for eventLabel ownership check'
            },
            {
                scenario: 'input exists but ID is undefined',
                resourceType: 'loggableEvent',
                args: { input: {} },
                expectedMessage: 'Resource ID is required for loggableEvent ownership check'
            },
            {
                scenario: 'empty string ID is provided',
                resourceType: 'eventLabel',
                args: { id: '' },
                expectedMessage: 'Resource ID is required for eventLabel ownership check'
            }
        ])('should throw VALIDATION_ERROR when $scenario', ({ resourceType, args, expectedMessage }) => {
            expect(() => processAuthDirectiveArgs(resourceType, args as ResourceArgs)).toThrowError(
                new GraphQLError(expectedMessage, {
                    extensions: { code: 'VALIDATION_ERROR' }
                })
            );
        });
    });

    describe('ID decoding', () => {
        it('should decode loggableEvent ID correctly', () => {
            const mockEvent = createMockLoggableEvent();
            const encodedId = encoder.encode(mockEvent.id, 'loggableEvent');
            const args = { id: encodedId };

            const result = processAuthDirectiveArgs('loggableEvent', args);

            expect(result.resourceId).toBe(mockEvent.id);
            expect(result.resourceType).toBe('loggableEvent');
        });

        it('should decode eventLabel ID correctly', () => {
            const mockLabel = createMockEventLabel();
            const encodedId = encoder.encode(mockLabel.id, 'eventLabel');
            const args = { id: encodedId };

            const result = processAuthDirectiveArgs('eventLabel', args);

            expect(result.resourceId).toBe(mockLabel.id);
            expect(result.resourceType).toBe('eventLabel');
        });

        it('should throw error for invalid encoded ID format', () => {
            const args = { id: 'not-a-valid-encoded-id' };

            expect(() => processAuthDirectiveArgs('loggableEvent', args)).toThrow();
        });

        it('should throw error when ID is encoded for wrong resource type', () => {
            // Create a label and encode its ID as eventLabel type
            const mockLabel = createMockEventLabel();
            const encodedId = encoder.encode(mockLabel.id, 'eventLabel');
            const args = { id: encodedId };

            // But try to process it as a loggableEvent
            expect(() => processAuthDirectiveArgs('loggableEvent', args)).toThrow();
        });
    });

    describe('Integration scenarios', () => {
        it.each([
            {
                scenario: 'typical update mutation args',
                resourceType: 'loggableEvent' as const,
                createMock: () => createMockLoggableEvent(),
                buildArgs: (encodedId: string) => ({
                    input: {
                        id: encodedId,
                        name: 'Updated Event',
                        description: 'Updated description'
                    }
                })
            },
            {
                scenario: 'typical delete mutation args',
                resourceType: 'eventLabel' as const,
                createMock: () => createMockEventLabel(),
                buildArgs: (encodedId: string) => ({ id: encodedId })
            },
            {
                scenario: 'query args structure',
                resourceType: 'loggableEvent' as const,
                createMock: () => createMockLoggableEvent(),
                buildArgs: (encodedId: string) => ({ id: encodedId })
            },
            {
                scenario: 'nested input with additional fields',
                resourceType: 'eventLabel' as const,
                createMock: () => createMockEventLabel(),
                buildArgs: (encodedId: string) => ({
                    input: {
                        id: encodedId,
                        name: 'New Name',
                        color: '#FF0000',
                        otherField: 'value'
                    },
                    someOtherArg: 'ignored'
                })
            }
        ])('should handle $scenario', ({ resourceType, createMock, buildArgs }) => {
            const mockResource = createMock();
            const encodedId = encoder.encode(mockResource.id, resourceType);
            const args = buildArgs(encodedId);

            const result = processAuthDirectiveArgs(resourceType, args);

            expect(result).toEqual({
                resourceType,
                resourceId: mockResource.id
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle when args.input is null but args.id exists', () => {
            const mockEvent = createMockLoggableEvent();
            const encodedId = encoder.encode(mockEvent.id, 'loggableEvent');
            const args = {
                input: null,
                id: encodedId
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = processAuthDirectiveArgs('loggableEvent', args as any);

            expect(result.resourceId).toBe(mockEvent.id);
        });

        it('should handle when args.input.id is empty string', () => {
            const args = {
                input: { id: '' }
            };

            expect(() => processAuthDirectiveArgs('eventLabel', args)).toThrowError(
                new GraphQLError('Resource ID is required for eventLabel ownership check', {
                    extensions: { code: 'VALIDATION_ERROR' }
                })
            );
        });

        it('should handle multiple mock events with different IDs', () => {
            const mockEvent1 = createMockLoggableEvent();
            const mockEvent2 = createMockLoggableEvent();

            // Ensure mock factory creates different IDs
            expect(mockEvent1.id).not.toBe(mockEvent2.id);

            const encodedId1 = encoder.encode(mockEvent1.id, 'loggableEvent');
            const encodedId2 = encoder.encode(mockEvent2.id, 'loggableEvent');

            const result1 = processAuthDirectiveArgs('loggableEvent', { id: encodedId1 });
            const result2 = processAuthDirectiveArgs('loggableEvent', { id: encodedId2 });

            expect(result1.resourceId).toBe(mockEvent1.id);
            expect(result2.resourceId).toBe(mockEvent2.id);
            expect(result1.resourceId).not.toBe(result2.resourceId);
        });
    });
});
