import { GraphQLError } from 'graphql';
import Sqids from 'sqids';
import { z } from 'zod';

import { isGraphQLError } from './error.js';

export type EntityType = 'user' | 'loggableEvent' | 'eventLabel';

// MongoDB ObjectId validation schema
const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid MongoDB ObjectId format');

/**
 * Pre-defined alphabets for each entity type
 * Using different alphabets adds a layer of obfuscation
 * Hardcoded for faster cold starts on Vercel
 *
 * Note: These alphabets are safe to hardcode and don't need to be secrets:
 * - They're formatting parameters, not cryptographic keys
 * - Changing them would break existing ID decoding
 * - Security comes from unpredictable database IDs, not the alphabet
 * - Anyone with encoded IDs could reverse-engineer the alphabet anyway
 */
const ALPHABETS = {
    user: 'k3G7QAe51FCsPW89uBOhIpwqjlDogSKZzMxnr2LTtV6bdaYmJvERHfNXy4cU',
    loggableEvent: 'xnrLtV6bdaYmJvERHfNXy4cUk3G7QAe51FCsPW89uBOhIpwqjlDogSKZzM2',
    eventLabel: 'uBOhIpwqjlDogSKZzMxnr2LTtV6bdaYmJvERHfNXy4cUk3G7QAe51FCsPW89'
} as const;

// Lazy-loaded Sqids instances to minimize cold start impact
const sqidsCache = new Map<EntityType, Sqids>();

/**
 * Gets or creates a Sqids instance for the given entity type
 * Cached within the request lifecycle
 */
function getSqids(entityType: EntityType): Sqids {
    let sqids = sqidsCache.get(entityType);
    if (!sqids) {
        sqids = new Sqids({
            alphabet: ALPHABETS[entityType],
            minLength: 11 // Balanced between security and UX
        });
        sqidsCache.set(entityType, sqids);
    }
    return sqids;
}

/**
 * Lightweight ID encoder using Sqids
 * Optimized for Vercel serverless with minimal initialization overhead
 */
export class IdEncoder {
    /**
     * Encodes a database ID into a URL-safe string
     * @param id - The database ID to encode (MongoDB ObjectId)
     * @param entityType - The type of entity
     * @returns Encoded ID string
     */
    encode(id: string, entityType: EntityType): string {
        if (!id) {
            throw new GraphQLError('Cannot encode empty ID', {
                extensions: { code: 'BAD_REQUEST' }
            });
        }

        // Validate ObjectId format
        const validation = objectIdSchema.safeParse(id);
        if (!validation.success) {
            throw new GraphQLError('Invalid ID format', {
                extensions: { code: 'BAD_REQUEST' }
            });
        }

        try {
            const numbers = this.idToNumbers(id);
            return getSqids(entityType).encode(numbers);
        } catch {
            // Don't expose internal errors
            throw new GraphQLError('Failed to encode ID', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
        }
    }

    /**
     * Decodes an encoded ID back to the original database ID
     * @param encodedId - The encoded ID string
     * @param entityType - The expected entity type
     * @returns Original database ID
     */
    decode(encodedId: string, entityType: EntityType): string {
        if (!encodedId) {
            throw new GraphQLError('Cannot decode empty ID', {
                extensions: { code: 'BAD_REQUEST' }
            });
        }

        try {
            const sqids = getSqids(entityType);
            const numbers = sqids.decode(encodedId);

            if (!numbers || numbers.length === 0) {
                throw new GraphQLError('Invalid ID format', {
                    extensions: { code: 'BAD_REQUEST' }
                });
            }

            return this.numbersToId(numbers);
        } catch (error) {
            if (isGraphQLError(error)) {
                throw error;
            }

            throw new GraphQLError('Invalid ID format', {
                extensions: { code: 'BAD_REQUEST' }
            });
        }
    }

    /**
     * Encodes multiple IDs efficiently
     * @param ids - Array of database IDs (MongoDB ObjectIds)
     * @param entityType - The type of entity
     * @returns Array of encoded IDs (invalid ObjectIds or IDs that fail to encode are silently filtered out)
     */
    encodeBatch(ids: string[], entityType: EntityType): string[] {
        if (!ids || ids.length === 0) {
            return [];
        }

        // Use same Sqids instance for all IDs in batch
        const sqids = getSqids(entityType);
        return ids
            .map((id, index) => {
                if (!id) return '';

                // Validate ObjectId format
                const validation = objectIdSchema.safeParse(id);
                if (!validation.success) {
                    console.warn(`IdEncoder.encodeBatch: Invalid ObjectId format at index ${index}: "${id}"`);
                    return ''; // Skip invalid IDs in batch operations
                }

                try {
                    const numbers = this.idToNumbers(id);
                    return sqids.encode(numbers);
                } catch (error) {
                    console.warn(`IdEncoder.encodeBatch: Failed to encode ID at index ${index}: "${id}"`, error);
                    return ''; // Skip IDs that fail to encode
                }
            })
            .filter(Boolean);
    }

    /**
     * Decodes multiple IDs efficiently
     * @param encodedIds - Array of encoded IDs
     * @param entityType - The expected entity type
     * @returns Array of original database IDs (invalid encoded IDs are silently filtered out)
     */
    decodeBatch(encodedIds: string[], entityType: EntityType): string[] {
        if (!encodedIds || encodedIds.length === 0) {
            return [];
        }

        // Use same Sqids instance for all IDs in batch
        const sqids = getSqids(entityType);
        return encodedIds
            .map((encodedId, index) => {
                if (!encodedId) return '';

                try {
                    const numbers = sqids.decode(encodedId);
                    if (!numbers || numbers.length === 0) {
                        console.warn(`IdEncoder.decodeBatch: Invalid encoded ID at index ${index}: "${encodedId}"`);
                        return '';
                    }
                    return this.numbersToId(numbers);
                } catch (error) {
                    console.warn(`IdEncoder.decodeBatch: Failed to decode ID at index ${index}: "${encodedId}"`, error);
                    return '';
                }
            })
            .filter(Boolean);
    }

    /**
     * Checks if a string looks like an encoded ID
     * @param value - String to check
     * @param entityType - Optional entity type for alphabet validation
     * @returns boolean
     */
    isEncodedId(value: string, entityType?: EntityType): boolean {
        if (!value || value.length < 11) {
            return false;
        }

        if (entityType) {
            const alphabet = ALPHABETS[entityType];
            return value.split('').every((char) => alphabet.includes(char));
        }

        // Check against all alphabets
        const allChars = new Set(Object.values(ALPHABETS).join(''));
        return value.split('').every((char) => allChars.has(char));
    }

    /**
     * Converts MongoDB ObjectId to numbers for Sqids
     * Optimized for minimal memory allocation
     */
    private idToNumbers(id: string): number[] {
        // MongoDB ObjectIds are 24 hex chars
        // Split into 3 chunks of 8 chars (32 bits each)
        // This fits safely in JavaScript numbers
        return [parseInt(id.slice(0, 8), 16), parseInt(id.slice(8, 16), 16), parseInt(id.slice(16, 24), 16)];
    }

    /**
     * Converts numbers back to MongoDB ObjectId
     */
    private numbersToId(numbers: number[]): string {
        if (numbers.length !== 3) {
            throw new Error('Invalid number array length');
        }

        // Convert each number back to 8-char hex string
        return numbers.map((num) => num.toString(16).padStart(8, '0')).join('');
    }
}

// Singleton instance - created once per cold start
let instance: IdEncoder | null = null;

/**
 * Gets the singleton IdEncoder instance
 * @returns IdEncoder instance
 */
export function getIdEncoder(): IdEncoder {
    if (!instance) {
        instance = new IdEncoder();
    }
    return instance;
}

// Export for testing
export function resetIdEncoder(): void {
    instance = null;
    sqidsCache.clear();
}
