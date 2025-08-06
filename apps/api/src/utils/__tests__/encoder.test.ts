import { GraphQLError } from 'graphql';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { IdEncoder, getIdEncoder, resetIdEncoder } from '../encoder.js';

describe('IdEncoder', () => {
    let encoder: IdEncoder;
    const sampleObjectId = '507f1f77bcf86cd799439011';
    const sampleObjectId2 = '507f191e810c19729de860ea';

    beforeEach(() => {
        resetIdEncoder();
        encoder = new IdEncoder();
    });

    describe('encode', () => {
        it('should encode a valid MongoDB ObjectId', () => {
            const encoded = encoder.encode(sampleObjectId, 'user');

            expect(encoded).toBeTruthy();
            expect(encoded.length).toBeGreaterThanOrEqual(11);
            expect(encoded).not.toBe(sampleObjectId);
        });

        it('should encode different IDs to different values', () => {
            const encoded1 = encoder.encode(sampleObjectId, 'user');
            const encoded2 = encoder.encode(sampleObjectId2, 'user');

            expect(encoded1).not.toBe(encoded2);
        });

        it('should encode same ID consistently (deterministic)', () => {
            const encoded1 = encoder.encode(sampleObjectId, 'user');
            const encoded2 = encoder.encode(sampleObjectId, 'user');

            expect(encoded1).toBe(encoded2);
        });

        it('should produce different encodings for different entity types', () => {
            const userEncoded = encoder.encode(sampleObjectId, 'user');
            const eventEncoded = encoder.encode(sampleObjectId, 'loggableEvent');
            const labelEncoded = encoder.encode(sampleObjectId, 'eventLabel');

            expect(userEncoded).not.toBe(eventEncoded);
            expect(userEncoded).not.toBe(labelEncoded);
            expect(eventEncoded).not.toBe(labelEncoded);
        });

        it('should throw GraphQLError for empty ID', () => {
            expect(() => encoder.encode('', 'user')).toThrow(GraphQLError);
            expect(() => encoder.encode('', 'user')).toThrow('Cannot encode empty ID');
        });

        it.each([
            { id: '000000000000000000000000' },
            { id: 'ffffffffffffffffffffffff' },
            { id: '123456789abcdef012345678' },
            { id: 'abcdef0123456789abcdef01' }
        ])('should handle valid MongoDB ObjectId: $id', ({ id }) => {
            expect(() => encoder.encode(id, 'user')).not.toThrow();
        });

        it.each([
            { id: 'not-an-objectid', description: 'non-hex string' },
            { id: '123', description: 'too short' },
            { id: 'gggggggggggggggggggggggg', description: 'invalid hex chars' },
            { id: '507f1f77bcf86cd79943901', description: '23 chars instead of 24' },
            { id: '507f1f77bcf86cd7994390111', description: '25 chars instead of 24' },
            { id: '507f1f77bcf86cd79943901!', description: 'special character' },
            { id: 'ZZZf1f77bcf86cd799439011', description: 'invalid hex chars' }
        ])('should throw for invalid ObjectId: $description', ({ id }) => {
            expect(() => encoder.encode(id, 'user')).toThrowError(
                new GraphQLError('Invalid ID format', {
                    extensions: { code: 'BAD_REQUEST' }
                })
            );
        });

        it('should throw INTERNAL_SERVER_ERROR when encoding process fails', () => {
            // Spy on the private idToNumbers method and make it throw
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const idToNumbersSpy = vi.spyOn(encoder as any, 'idToNumbers').mockImplementation(() => {
                throw new Error('Simulated internal error');
            });

            expect(() => encoder.encode(sampleObjectId, 'user')).toThrowError(
                new GraphQLError('Failed to encode ID', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' }
                })
            );

            idToNumbersSpy.mockRestore();
        });
    });

    describe('decode', () => {
        it('should decode back to original ID', () => {
            const encoded = encoder.encode(sampleObjectId, 'user');
            const decoded = encoder.decode(encoded, 'user');

            expect(decoded).toBe(sampleObjectId);
        });

        it('should handle all entity types correctly', () => {
            const types: Array<'user' | 'loggableEvent' | 'eventLabel'> = ['user', 'loggableEvent', 'eventLabel'];

            types.forEach((type) => {
                const encoded = encoder.encode(sampleObjectId, type);
                const decoded = encoder.decode(encoded, type);
                expect(decoded).toBe(sampleObjectId);
            });
        });

        it('should throw GraphQLError for empty encoded ID', () => {
            expect(() => encoder.decode('', 'user')).toThrow(GraphQLError);
            expect(() => encoder.decode('', 'user')).toThrow('Cannot decode empty ID');
        });

        it('should throw error for invalid encoded format', () => {
            const invalidIds = [
                'short', // Too short
                '1234567890', // Wrong alphabet
                'invalid!@#$', // Invalid characters
                '           ' // Spaces
            ];

            invalidIds.forEach((invalidId) => {
                expect(() => encoder.decode(invalidId, 'user')).toThrow(GraphQLError);
                expect(() => encoder.decode(invalidId, 'user')).toThrow('Invalid ID format');
            });
        });

        it('should throw error when decoding with wrong entity type', () => {
            const userEncoded = encoder.encode(sampleObjectId, 'user');

            // Should throw because alphabet doesn't match
            expect(() => encoder.decode(userEncoded, 'loggableEvent')).toThrow(GraphQLError);
        });
    });

    describe('encodeBatch', () => {
        it('should encode multiple IDs', () => {
            const ids = [sampleObjectId, sampleObjectId2];
            const encoded = encoder.encodeBatch(ids, 'user');

            expect(encoded).toHaveLength(2);
            expect(encoded[0]).not.toBe(ids[0]);
            expect(encoded[1]).not.toBe(ids[1]);
            expect(encoded[0]).not.toBe(encoded[1]);
        });

        it('should return empty array for empty input', () => {
            expect(encoder.encodeBatch([], 'user')).toEqual([]);
        });

        it('should filter out empty IDs', () => {
            const ids = [sampleObjectId, '', sampleObjectId2, ''];
            const encoded = encoder.encodeBatch(ids, 'user');

            expect(encoded).toHaveLength(2);
        });
    });

    describe('decodeBatch', () => {
        it('should decode multiple IDs', () => {
            const ids = [sampleObjectId, sampleObjectId2];
            const encoded = encoder.encodeBatch(ids, 'user');
            const decoded = encoder.decodeBatch(encoded, 'user');

            expect(decoded).toEqual(ids);
        });

        it('should return empty array for empty input', () => {
            expect(encoder.decodeBatch([], 'user')).toEqual([]);
        });

        it('should filter out empty encoded IDs', () => {
            const encoded1 = encoder.encode(sampleObjectId, 'user');
            const encoded2 = encoder.encode(sampleObjectId2, 'user');
            const encodedIds = [encoded1, '', encoded2, ''];

            const decoded = encoder.decodeBatch(encodedIds, 'user');
            expect(decoded).toHaveLength(2);
            expect(decoded).toEqual([sampleObjectId, sampleObjectId2]);
        });

        it('should filter out invalid encoded IDs that decode to empty array', () => {
            const encoded1 = encoder.encode(sampleObjectId, 'user');
            const encoded2 = encoder.encode(sampleObjectId2, 'user');

            // These are valid sqids format but will decode to empty array
            // Using the minimum valid sqids that don't encode any numbers
            const invalidButValidFormat = 'abcdefghijk'; // Valid alphabet but doesn't decode to numbers

            const encodedIds = [encoded1, invalidButValidFormat, encoded2];

            const decoded = encoder.decodeBatch(encodedIds, 'user');
            expect(decoded).toHaveLength(2);
            expect(decoded).toEqual([sampleObjectId, sampleObjectId2]);
        });
    });

    describe('isEncodedId', () => {
        it('should return true for encoded IDs', () => {
            const encoded = encoder.encode(sampleObjectId, 'user');
            expect(encoder.isEncodedId(encoded)).toBe(true);
            expect(encoder.isEncodedId(encoded, 'user')).toBe(true);
        });

        it('should return false for non-encoded strings', () => {
            expect(encoder.isEncodedId(sampleObjectId)).toBe(false);
            expect(encoder.isEncodedId('regular-string')).toBe(false);
            expect(encoder.isEncodedId('123')).toBe(false);
        });

        it('should return false for too short strings', () => {
            expect(encoder.isEncodedId('short')).toBe(false);
            expect(encoder.isEncodedId('1234567890')).toBe(false);
        });

        it('should validate against specific entity type alphabet', () => {
            const userEncoded = encoder.encode(sampleObjectId, 'user');

            expect(encoder.isEncodedId(userEncoded, 'user')).toBe(true);
            // Different alphabet, so should be false
            expect(encoder.isEncodedId(userEncoded, 'loggableEvent')).toBe(false);
        });
    });

    describe('singleton behavior', () => {
        it('should return same instance', () => {
            const instance1 = getIdEncoder();
            const instance2 = getIdEncoder();

            expect(instance1).toBe(instance2);
        });

        it('should reset singleton with resetIdEncoder', () => {
            const instance1 = getIdEncoder();
            resetIdEncoder();
            const instance2 = getIdEncoder();

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('edge cases', () => {
        it('should handle hex case differences in ObjectIds', () => {
            const lowercaseId = '507f1f77bcf86cd799439011';
            const uppercaseId = '507F1F77BCF86CD799439011';

            const encoded1 = encoder.encode(lowercaseId, 'user');
            const encoded2 = encoder.encode(uppercaseId, 'user');

            // Verify they encode properly
            expect(encoded1).toBeTruthy();
            expect(encoded2).toBeTruthy();

            // Decode back and verify case is preserved
            const decoded1 = encoder.decode(encoded1, 'user');
            const decoded2 = encoder.decode(encoded2, 'user');

            expect(decoded1).toBe(lowercaseId);
            expect(decoded2.toLowerCase()).toBe(uppercaseId.toLowerCase());
        });

        it('should handle ObjectIds with all same characters', () => {
            const sameCharsId = '000000000000000000000000';
            const encoded = encoder.encode(sameCharsId, 'user');
            const decoded = encoder.decode(encoded, 'user');

            expect(decoded).toBe(sameCharsId);
        });
    });
});
