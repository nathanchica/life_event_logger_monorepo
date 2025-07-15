import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError, GraphQLFieldConfig, GraphQLSchema } from 'graphql';

import { GraphQLContext } from '../context';

/**
 * Resource types that can be protected by the @requireOwner directive
 */
type ProtectedResourceType = 'loggableEvent' | 'eventLabel';

/**
 * Input arguments that may contain a resource ID for ownership validation
 */
interface ResourceArgs {
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
 * @param context - GraphQL context containing user and prisma client
 * @param resourceType - Type of resource to check (loggableEvent or eventLabel)
 * @param resourceId - ID of the resource to validate ownership for
 * @throws {GraphQLError} When resource not found or user doesn't own it
 */
async function validateResourceOwnership(
    context: GraphQLContext,
    resourceType: ProtectedResourceType,
    resourceId: string
): Promise<void> {
    if (!context.user) {
        throw new GraphQLError('User not authenticated', {
            extensions: { code: 'UNAUTHORIZED' }
        });
    }

    try {
        let resource;

        if (resourceType === 'loggableEvent') {
            resource = await context.prisma.loggableEvent.findUnique({
                where: { id: resourceId },
                select: { userId: true }
            });
        } else if (resourceType === 'eventLabel') {
            resource = await context.prisma.eventLabel.findUnique({
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

        if (resource.userId !== context.user.id) {
            throw new GraphQLError(`You do not have permission to access this ${resourceType}`, {
                extensions: { code: 'FORBIDDEN' }
            });
        }
    } catch (error) {
        if (error instanceof GraphQLError) {
            throw error;
        }
        throw new GraphQLError('Failed to verify resource ownership', {
            extensions: { code: 'INTERNAL_ERROR' }
        });
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
        [MapperKind.OBJECT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, GraphQLContext>) => {
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

                    // If @requireOwner directive, perform ownership validation
                    if (requireOwnerDirective) {
                        const resourceType = requireOwnerDirective.resource;
                        const resourceId = extractResourceId(args);

                        if (!resourceId) {
                            throw new GraphQLError(`Resource ID is required for ${resourceType} ownership check`, {
                                extensions: { code: 'VALIDATION_ERROR' }
                            });
                        }

                        await validateResourceOwnership(context, resourceType, resourceId);
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
