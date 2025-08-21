import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { PrismaClient, User } from '@prisma/client';
import { defaultFieldResolver, GraphQLError, GraphQLFieldConfig, GraphQLSchema } from 'graphql';

import { GraphQLContext } from '../context.js';
import { getIdEncoder } from '../utils/encoder.js';
import { isGraphQLError } from '../utils/error.js';

/**
 * Resource types that can be protected by the @requireOwner directive
 */
type ProtectedResourceType = 'loggableEvent' | 'eventLabel';

/**
 * Array of valid protected resource types for runtime validation
 */
const VALID_RESOURCE_TYPES: readonly ProtectedResourceType[] = ['loggableEvent', 'eventLabel'] as const;

/**
 * Type guard to check if a string is a valid ProtectedResourceType
 */
function isValidResourceType(type: string): type is ProtectedResourceType {
    return VALID_RESOURCE_TYPES.includes(type as ProtectedResourceType);
}

/**
 * Input arguments that may contain a resource ID for ownership validation
 */
export interface ResourceArgs {
    id?: string;
    input?: {
        id?: string;
    };
}

/**
 * Directive configuration for @requireOwner
 */
interface RequireOwnerDirective {
    resource: ProtectedResourceType;
}

/**
 * Validates that a user owns the specified resource
 *
 * @param user - Authenticated user
 * @param prisma - Prisma client instance
 * @param resourceType - Type of resource to check (loggableEvent or eventLabel)
 * @param resourceId - ID of the resource to validate ownership for
 * @throws {GraphQLError} When resource not found or user doesn't own it
 */
export async function validateResourceOwnership(
    user: User,
    prisma: PrismaClient,
    resourceType: ProtectedResourceType,
    resourceId: string
): Promise<void> {
    try {
        let resource;

        if (resourceType === 'loggableEvent') {
            resource = await prisma.loggableEvent.findUnique({
                where: { id: resourceId },
                select: { userId: true }
            });
        } else if (resourceType === 'eventLabel') {
            resource = await prisma.eventLabel.findUnique({
                where: { id: resourceId },
                select: { userId: true }
            });
        } else {
            throw new GraphQLError(`Unknown resource type: ${resourceType}`, {
                extensions: { code: 'INTERNAL_ERROR' }
            });
        }

        if (!resource) {
            throw new GraphQLError(`${resourceType} not found`, {
                extensions: { code: 'NOT_FOUND' }
            });
        }

        if (resource.userId !== user.id) {
            throw new GraphQLError(`You do not have permission to access this ${resourceType}`, {
                extensions: { code: 'FORBIDDEN' }
            });
        }
    } catch (error) {
        if (isGraphQLError(error)) {
            throw error;
        }
        console.error('Failed to verify resource ownership:', error);
        throw new Error('Failed to verify resource ownership');
    }
}

/**
 * Extracts resource ID from GraphQL field arguments
 *
 * @param args - GraphQL field arguments
 * @returns Resource ID if found, null otherwise
 */
function extractResourceId(args: ResourceArgs): string | null {
    return args.input?.id || args.id || null;
}

/**
 * Processes the arguments for the @requireOwner directive
 *
 * @param resourceType - Type of resource to validate ownership for
 * @param resourceArgs - Arguments containing resource ID
 * @returns Object containing validated resource type and decoded ID
 */
export function processAuthDirectiveArgs(
    resourceType: string,
    resourceArgs: ResourceArgs
): { resourceType: ProtectedResourceType; resourceId: string } {
    if (!isValidResourceType(resourceType)) {
        throw new GraphQLError(`Unknown resource type: ${resourceType}`, {
            extensions: { code: 'INTERNAL_ERROR' }
        });
    }

    const resourceId = extractResourceId(resourceArgs);
    if (!resourceId) {
        throw new GraphQLError(`Resource ID is required for ${resourceType} ownership check`, {
            extensions: { code: 'VALIDATION_ERROR' }
        });
    }

    const encoder = getIdEncoder();
    const decodedId = encoder.decode(resourceId, resourceType);

    return { resourceType: resourceType as ProtectedResourceType, resourceId: decodedId };
}

/**
 * Schema transformer that applies authentication and authorization directives
 *
 * Supports two directives:
 * - @requireAuth: Requires user authentication
 * - @requireOwner(resource: String!): Requires authentication + resource ownership
 *
 * @param schema - GraphQL schema to transform
 * @returns Transformed schema with directive logic applied
 */
export function authDirectiveTransformer(schema: GraphQLSchema): GraphQLSchema {
    return mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig: GraphQLFieldConfig<unknown, GraphQLContext>) => {
            const requireAuthDirective = getDirective(schema, fieldConfig, 'requireAuth')?.[0];
            const requireOwnerDirective = getDirective(schema, fieldConfig, 'requireOwner')?.[0] as
                | RequireOwnerDirective
                | undefined;

            if (requireAuthDirective || requireOwnerDirective) {
                const { resolve = defaultFieldResolver } = fieldConfig;

                fieldConfig.resolve = async function (source, args: ResourceArgs, context: GraphQLContext, info) {
                    // Check authentication first (required for both directives)
                    if (!context.user) {
                        throw new GraphQLError('Not authenticated', {
                            extensions: { code: 'UNAUTHORIZED' }
                        });
                    }

                    // If @requireOwner directive, validate resourceType then resourceId then ownership
                    if (requireOwnerDirective) {
                        const { resourceType, resourceId } = processAuthDirectiveArgs(
                            requireOwnerDirective.resource,
                            args
                        );
                        await validateResourceOwnership(context.user, context.prisma, resourceType, resourceId);
                    }

                    // Proceed with the original resolver
                    return resolve(source, args, context, info);
                };

                return fieldConfig;
            }

            return fieldConfig;
        }
    });
}
