import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import {
    User as PrismaUser,
    LoggableEvent as PrismaLoggableEvent,
    EventLabel as PrismaEventLabel
} from '@prisma/client';
import { GraphQLContext } from '../context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
    /** ISO 8601 compliant date-time scalar */
    DateTime: { input: Date | string; output: Date | string };
};

/** Input for adding a timestamp to a loggable event */
export type AddTimestampToEventMutationInput = {
    /** ID of the loggable event to add timestamp to */
    id: Scalars['ID']['input'];
    /** ISO string timestamp to add to the event */
    timestamp: Scalars['DateTime']['input'];
};

/** Response payload for adding a timestamp to a loggable event */
export type AddTimestampToEventMutationPayload = {
    __typename?: 'AddTimestampToEventMutationPayload';
    /** Array of errors that occurred during update */
    errors: Array<GenericApiError>;
    /** The updated loggable event, null if update failed */
    loggableEvent?: Maybe<LoggableEvent>;
};

/** Input for creating a new event label */
export type CreateEventLabelMutationInput = {
    /** Temporary ID for the label, used before creation. Will be replaced with the actual ID after creation. */
    id: Scalars['ID']['input'];
    /** Name for the label (max 25 characters, cannot be empty) */
    name: Scalars['String']['input'];
};

/** Response payload for creating an event label */
export type CreateEventLabelMutationPayload = {
    __typename?: 'CreateEventLabelMutationPayload';
    /** Array of errors that occurred during creation */
    errors: Array<GenericApiError>;
    /** The created event label, null if creation failed */
    eventLabel?: Maybe<EventLabel>;
    /** Temporary ID for the label, used before creation. */
    tempID?: Maybe<Scalars['ID']['output']>;
};

/** Input for creating a new loggable event */
export type CreateLoggableEventMutationInput = {
    /** Temporary ID for the event, used before creation. Will be replaced with the actual ID after creation. */
    id: Scalars['ID']['input'];
    /** Array of label IDs to associate with this event */
    labelIds?: InputMaybe<Array<Scalars['String']['input']>>;
    /** Name for the event (max 25 characters, cannot be empty) */
    name: Scalars['String']['input'];
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays: Scalars['Int']['input'];
};

/** Response payload for creating a loggable event */
export type CreateLoggableEventMutationPayload = {
    __typename?: 'CreateLoggableEventMutationPayload';
    /** Array of errors that occurred during creation */
    errors: Array<GenericApiError>;
    /** The created loggable event, null if creation failed */
    loggableEvent?: Maybe<LoggableEvent>;
    /** Temporary ID for the event, used before creation. */
    tempID?: Maybe<Scalars['ID']['output']>;
};

/** Input for deleting an event label */
export type DeleteEventLabelMutationInput = {
    /** ID of the event label to delete */
    id: Scalars['ID']['input'];
};

/** Response payload for deleting an event label */
export type DeleteEventLabelMutationPayload = {
    __typename?: 'DeleteEventLabelMutationPayload';
    /** Array of errors that occurred during deletion */
    errors: Array<GenericApiError>;
    /** The deleted event label, null if deletion failed */
    eventLabel?: Maybe<EventLabel>;
};

/** Input for deleting a loggable event */
export type DeleteLoggableEventMutationInput = {
    /** ID of the loggable event to delete */
    id: Scalars['ID']['input'];
};

/** Response payload for deleting a loggable event */
export type DeleteLoggableEventMutationPayload = {
    __typename?: 'DeleteLoggableEventMutationPayload';
    /** Array of errors that occurred during deletion */
    errors: Array<GenericApiError>;
    /** The deleted loggable event, null if deletion failed */
    loggableEvent?: Maybe<LoggableEvent>;
};

/** Represents a label that can be associated with events for categorization */
export type EventLabel = {
    __typename?: 'EventLabel';
    /** Timestamp when the label was created */
    createdAt: Scalars['DateTime']['output'];
    /** Unique identifier for the label */
    id: Scalars['ID']['output'];
    /** Display name for the label */
    name: Scalars['String']['output'];
    /** Timestamp when the label was last updated */
    updatedAt: Scalars['DateTime']['output'];
    /** User who owns this label */
    user: User;
};

/** Standard error type returned by mutations for consistent error handling */
export type GenericApiError = {
    __typename?: 'GenericApiError';
    /** Error code identifying the type of error (e.g., VALIDATION_ERROR, UNAUTHORIZED) */
    code: Scalars['String']['output'];
    /** The specific field that caused the error, if applicable */
    field?: Maybe<Scalars['String']['output']>;
    /** Human-readable error message describing what went wrong */
    message: Scalars['String']['output'];
};

/** Input for Google OAuth login mutation */
export type GoogleOAuthLoginMutationInput = {
    /** Google OAuth ID token from frontend */
    googleToken: Scalars['String']['input'];
};

/** Payload returned after successful Google OAuth login mutation */
export type GoogleOAuthLoginMutationPayload = {
    __typename?: 'GoogleOAuthLoginMutationPayload';
    /** List of errors that occurred during login */
    errors: Array<GenericApiError>;
    /** JWT token for the authenticated user */
    token?: Maybe<Scalars['String']['output']>;
    /** The authenticated user object */
    user?: Maybe<User>;
};

/** Represents an event that can be logged with timestamps */
export type LoggableEvent = {
    __typename?: 'LoggableEvent';
    /** Timestamp when the event was created */
    createdAt: Scalars['DateTime']['output'];
    /** Unique identifier for the event */
    id: Scalars['ID']['output'];
    /** Labels associated with this event for categorization */
    labels: Array<EventLabel>;
    /** Display name for the event */
    name: Scalars['String']['output'];
    /** Array of timestamps when this event occurred */
    timestamps: Array<Scalars['DateTime']['output']>;
    /** Timestamp when the event was last updated */
    updatedAt: Scalars['DateTime']['output'];
    /** User who owns this event */
    user: User;
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays: Scalars['Int']['output'];
};

/** Root type for GraphQL mutations */
export type Mutation = {
    __typename?: 'Mutation';
    /** Add a timestamp to an existing loggable event (must be owned by authenticated user) */
    addTimestampToEvent: AddTimestampToEventMutationPayload;
    /** Create a new event label for the authenticated user */
    createEventLabel: CreateEventLabelMutationPayload;
    /** Create a new loggable event for the authenticated user */
    createLoggableEvent: CreateLoggableEventMutationPayload;
    /** Delete an event label (must be owned by authenticated user) */
    deleteEventLabel: DeleteEventLabelMutationPayload;
    /** Delete a loggable event (must be owned by authenticated user) */
    deleteLoggableEvent: DeleteLoggableEventMutationPayload;
    /** Authenticate a user using Google OAuth ID token */
    googleOAuthLoginMutation: GoogleOAuthLoginMutationPayload;
    /** Remove a timestamp from an existing loggable event (must be owned by authenticated user) */
    removeTimestampFromEvent: RemoveTimestampFromEventMutationPayload;
    /** Update an existing event label (must be owned by authenticated user) */
    updateEventLabel: UpdateEventLabelMutationPayload;
    /** Update an existing loggable event (must be owned by authenticated user) */
    updateLoggableEvent: UpdateLoggableEventMutationPayload;
};

/** Root type for GraphQL mutations */
export type MutationAddTimestampToEventArgs = {
    input: AddTimestampToEventMutationInput;
};

/** Root type for GraphQL mutations */
export type MutationCreateEventLabelArgs = {
    input: CreateEventLabelMutationInput;
};

/** Root type for GraphQL mutations */
export type MutationCreateLoggableEventArgs = {
    input: CreateLoggableEventMutationInput;
};

/** Root type for GraphQL mutations */
export type MutationDeleteEventLabelArgs = {
    input: DeleteEventLabelMutationInput;
};

/** Root type for GraphQL mutations */
export type MutationDeleteLoggableEventArgs = {
    input: DeleteLoggableEventMutationInput;
};

/** Root type for GraphQL mutations */
export type MutationGoogleOAuthLoginMutationArgs = {
    input: GoogleOAuthLoginMutationInput;
};

/** Root type for GraphQL mutations */
export type MutationRemoveTimestampFromEventArgs = {
    input: RemoveTimestampFromEventMutationInput;
};

/** Root type for GraphQL mutations */
export type MutationUpdateEventLabelArgs = {
    input: UpdateEventLabelMutationInput;
};

/** Root type for GraphQL mutations */
export type MutationUpdateLoggableEventArgs = {
    input: UpdateLoggableEventMutationInput;
};

/** Root type for GraphQL queries */
export type Query = {
    __typename?: 'Query';
    /** Get the currently authenticated user's profile */
    loggedInUser?: Maybe<User>;
};

/** Input for removing a timestamp from a loggable event */
export type RemoveTimestampFromEventMutationInput = {
    /** ID of the loggable event to remove timestamp from */
    id: Scalars['ID']['input'];
    /** ISO string timestamp to remove from the event */
    timestamp: Scalars['DateTime']['input'];
};

/** Response payload for removing a timestamp from a loggable event */
export type RemoveTimestampFromEventMutationPayload = {
    __typename?: 'RemoveTimestampFromEventMutationPayload';
    /** Array of errors that occurred during update */
    errors: Array<GenericApiError>;
    /** The updated loggable event, null if update failed */
    loggableEvent?: Maybe<LoggableEvent>;
};

/** Input for updating an existing event label */
export type UpdateEventLabelMutationInput = {
    /** ID of the event label to update */
    id: Scalars['ID']['input'];
    /** Updated name for the label (max 25 characters, cannot be empty) */
    name?: InputMaybe<Scalars['String']['input']>;
};

/** Response payload for updating an event label */
export type UpdateEventLabelMutationPayload = {
    __typename?: 'UpdateEventLabelMutationPayload';
    /** Array of errors that occurred during update */
    errors: Array<GenericApiError>;
    /** The updated event label, null if update failed */
    eventLabel?: Maybe<EventLabel>;
};

/** Input for updating an existing loggable event */
export type UpdateLoggableEventMutationInput = {
    /** ID of the loggable event to update */
    id: Scalars['ID']['input'];
    /** Updated name for the event (max 25 characters, cannot be empty) */
    name?: InputMaybe<Scalars['String']['input']>;
    /** Array of timestamps for this event */
    timestamps?: InputMaybe<Array<Scalars['DateTime']['input']>>;
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays?: InputMaybe<Scalars['Int']['input']>;
};

/** Response payload for updating a loggable event */
export type UpdateLoggableEventMutationPayload = {
    __typename?: 'UpdateLoggableEventMutationPayload';
    /** Array of errors that occurred during update */
    errors: Array<GenericApiError>;
    /** The updated loggable event, null if update failed */
    loggableEvent?: Maybe<LoggableEvent>;
};

/** Represents an authenticated user in the system */
export type User = {
    __typename?: 'User';
    /** Timestamp when the user was first created */
    createdAt: Scalars['DateTime']['output'];
    /** User's email address */
    email: Scalars['String']['output'];
    /** All event labels created by this user */
    eventLabels: Array<EventLabel>;
    /** External authentication provider identifier */
    googleId: Scalars['String']['output'];
    /** Unique identifier for the user */
    id: Scalars['ID']['output'];
    /** All loggable events created by this user */
    loggableEvents: Array<LoggableEvent>;
    /** User's display name */
    name: Scalars['String']['output'];
    /** Timestamp when the user record was last updated */
    updatedAt: Scalars['DateTime']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
    resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
    | ResolverFn<TResult, TParent, TContext, TArgs>
    | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
    subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
    resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
    subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
    resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
    | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
    | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
    | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
    | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
    parent: TParent,
    context: TContext,
    info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
    obj: T,
    context: TContext,
    info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
    next: NextResolverFn<TResult>,
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
    AddTimestampToEventMutationInput: AddTimestampToEventMutationInput;
    AddTimestampToEventMutationPayload: ResolverTypeWrapper<
        Omit<AddTimestampToEventMutationPayload, 'loggableEvent'> & {
            loggableEvent?: Maybe<ResolversTypes['LoggableEvent']>;
        }
    >;
    Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
    CreateEventLabelMutationInput: CreateEventLabelMutationInput;
    CreateEventLabelMutationPayload: ResolverTypeWrapper<
        Omit<CreateEventLabelMutationPayload, 'eventLabel'> & { eventLabel?: Maybe<ResolversTypes['EventLabel']> }
    >;
    CreateLoggableEventMutationInput: CreateLoggableEventMutationInput;
    CreateLoggableEventMutationPayload: ResolverTypeWrapper<
        Omit<CreateLoggableEventMutationPayload, 'loggableEvent'> & {
            loggableEvent?: Maybe<ResolversTypes['LoggableEvent']>;
        }
    >;
    DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
    DeleteEventLabelMutationInput: DeleteEventLabelMutationInput;
    DeleteEventLabelMutationPayload: ResolverTypeWrapper<
        Omit<DeleteEventLabelMutationPayload, 'eventLabel'> & { eventLabel?: Maybe<ResolversTypes['EventLabel']> }
    >;
    DeleteLoggableEventMutationInput: DeleteLoggableEventMutationInput;
    DeleteLoggableEventMutationPayload: ResolverTypeWrapper<
        Omit<DeleteLoggableEventMutationPayload, 'loggableEvent'> & {
            loggableEvent?: Maybe<ResolversTypes['LoggableEvent']>;
        }
    >;
    EventLabel: ResolverTypeWrapper<PrismaEventLabel>;
    GenericApiError: ResolverTypeWrapper<GenericApiError>;
    GoogleOAuthLoginMutationInput: GoogleOAuthLoginMutationInput;
    GoogleOAuthLoginMutationPayload: ResolverTypeWrapper<
        Omit<GoogleOAuthLoginMutationPayload, 'user'> & { user?: Maybe<ResolversTypes['User']> }
    >;
    ID: ResolverTypeWrapper<Scalars['ID']['output']>;
    Int: ResolverTypeWrapper<Scalars['Int']['output']>;
    LoggableEvent: ResolverTypeWrapper<PrismaLoggableEvent>;
    Mutation: ResolverTypeWrapper<{}>;
    Query: ResolverTypeWrapper<{}>;
    RemoveTimestampFromEventMutationInput: RemoveTimestampFromEventMutationInput;
    RemoveTimestampFromEventMutationPayload: ResolverTypeWrapper<
        Omit<RemoveTimestampFromEventMutationPayload, 'loggableEvent'> & {
            loggableEvent?: Maybe<ResolversTypes['LoggableEvent']>;
        }
    >;
    String: ResolverTypeWrapper<Scalars['String']['output']>;
    UpdateEventLabelMutationInput: UpdateEventLabelMutationInput;
    UpdateEventLabelMutationPayload: ResolverTypeWrapper<
        Omit<UpdateEventLabelMutationPayload, 'eventLabel'> & { eventLabel?: Maybe<ResolversTypes['EventLabel']> }
    >;
    UpdateLoggableEventMutationInput: UpdateLoggableEventMutationInput;
    UpdateLoggableEventMutationPayload: ResolverTypeWrapper<
        Omit<UpdateLoggableEventMutationPayload, 'loggableEvent'> & {
            loggableEvent?: Maybe<ResolversTypes['LoggableEvent']>;
        }
    >;
    User: ResolverTypeWrapper<PrismaUser>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
    AddTimestampToEventMutationInput: AddTimestampToEventMutationInput;
    AddTimestampToEventMutationPayload: Omit<AddTimestampToEventMutationPayload, 'loggableEvent'> & {
        loggableEvent?: Maybe<ResolversParentTypes['LoggableEvent']>;
    };
    Boolean: Scalars['Boolean']['output'];
    CreateEventLabelMutationInput: CreateEventLabelMutationInput;
    CreateEventLabelMutationPayload: Omit<CreateEventLabelMutationPayload, 'eventLabel'> & {
        eventLabel?: Maybe<ResolversParentTypes['EventLabel']>;
    };
    CreateLoggableEventMutationInput: CreateLoggableEventMutationInput;
    CreateLoggableEventMutationPayload: Omit<CreateLoggableEventMutationPayload, 'loggableEvent'> & {
        loggableEvent?: Maybe<ResolversParentTypes['LoggableEvent']>;
    };
    DateTime: Scalars['DateTime']['output'];
    DeleteEventLabelMutationInput: DeleteEventLabelMutationInput;
    DeleteEventLabelMutationPayload: Omit<DeleteEventLabelMutationPayload, 'eventLabel'> & {
        eventLabel?: Maybe<ResolversParentTypes['EventLabel']>;
    };
    DeleteLoggableEventMutationInput: DeleteLoggableEventMutationInput;
    DeleteLoggableEventMutationPayload: Omit<DeleteLoggableEventMutationPayload, 'loggableEvent'> & {
        loggableEvent?: Maybe<ResolversParentTypes['LoggableEvent']>;
    };
    EventLabel: PrismaEventLabel;
    GenericApiError: GenericApiError;
    GoogleOAuthLoginMutationInput: GoogleOAuthLoginMutationInput;
    GoogleOAuthLoginMutationPayload: Omit<GoogleOAuthLoginMutationPayload, 'user'> & {
        user?: Maybe<ResolversParentTypes['User']>;
    };
    ID: Scalars['ID']['output'];
    Int: Scalars['Int']['output'];
    LoggableEvent: PrismaLoggableEvent;
    Mutation: {};
    Query: {};
    RemoveTimestampFromEventMutationInput: RemoveTimestampFromEventMutationInput;
    RemoveTimestampFromEventMutationPayload: Omit<RemoveTimestampFromEventMutationPayload, 'loggableEvent'> & {
        loggableEvent?: Maybe<ResolversParentTypes['LoggableEvent']>;
    };
    String: Scalars['String']['output'];
    UpdateEventLabelMutationInput: UpdateEventLabelMutationInput;
    UpdateEventLabelMutationPayload: Omit<UpdateEventLabelMutationPayload, 'eventLabel'> & {
        eventLabel?: Maybe<ResolversParentTypes['EventLabel']>;
    };
    UpdateLoggableEventMutationInput: UpdateLoggableEventMutationInput;
    UpdateLoggableEventMutationPayload: Omit<UpdateLoggableEventMutationPayload, 'loggableEvent'> & {
        loggableEvent?: Maybe<ResolversParentTypes['LoggableEvent']>;
    };
    User: PrismaUser;
}>;

export type RequireAuthDirectiveArgs = {};

export type RequireAuthDirectiveResolver<
    Result,
    Parent,
    ContextType = GraphQLContext,
    Args = RequireAuthDirectiveArgs
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type RequireOwnerDirectiveArgs = {
    resource: Scalars['String']['input'];
};

export type RequireOwnerDirectiveResolver<
    Result,
    Parent,
    ContextType = GraphQLContext,
    Args = RequireOwnerDirectiveArgs
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AddTimestampToEventMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['AddTimestampToEventMutationPayload'] = ResolversParentTypes['AddTimestampToEventMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    loggableEvent?: Resolver<Maybe<ResolversTypes['LoggableEvent']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CreateEventLabelMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['CreateEventLabelMutationPayload'] = ResolversParentTypes['CreateEventLabelMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    eventLabel?: Resolver<Maybe<ResolversTypes['EventLabel']>, ParentType, ContextType>;
    tempID?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CreateLoggableEventMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['CreateLoggableEventMutationPayload'] = ResolversParentTypes['CreateLoggableEventMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    loggableEvent?: Resolver<Maybe<ResolversTypes['LoggableEvent']>, ParentType, ContextType>;
    tempID?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
    name: 'DateTime';
}

export type DeleteEventLabelMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['DeleteEventLabelMutationPayload'] = ResolversParentTypes['DeleteEventLabelMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    eventLabel?: Resolver<Maybe<ResolversTypes['EventLabel']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DeleteLoggableEventMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['DeleteLoggableEventMutationPayload'] = ResolversParentTypes['DeleteLoggableEventMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    loggableEvent?: Resolver<Maybe<ResolversTypes['LoggableEvent']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventLabelResolvers<
    ContextType = GraphQLContext,
    ParentType extends ResolversParentTypes['EventLabel'] = ResolversParentTypes['EventLabel']
> = ResolversObject<{
    createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
    id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
    name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
    user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GenericApiErrorResolvers<
    ContextType = GraphQLContext,
    ParentType extends ResolversParentTypes['GenericApiError'] = ResolversParentTypes['GenericApiError']
> = ResolversObject<{
    code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    field?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GoogleOAuthLoginMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['GoogleOAuthLoginMutationPayload'] = ResolversParentTypes['GoogleOAuthLoginMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
    user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoggableEventResolvers<
    ContextType = GraphQLContext,
    ParentType extends ResolversParentTypes['LoggableEvent'] = ResolversParentTypes['LoggableEvent']
> = ResolversObject<{
    createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
    id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
    labels?: Resolver<Array<ResolversTypes['EventLabel']>, ParentType, ContextType>;
    name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    timestamps?: Resolver<Array<ResolversTypes['DateTime']>, ParentType, ContextType>;
    updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
    user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
    warningThresholdInDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<
    ContextType = GraphQLContext,
    ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = ResolversObject<{
    addTimestampToEvent?: Resolver<
        ResolversTypes['AddTimestampToEventMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationAddTimestampToEventArgs, 'input'>
    >;
    createEventLabel?: Resolver<
        ResolversTypes['CreateEventLabelMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationCreateEventLabelArgs, 'input'>
    >;
    createLoggableEvent?: Resolver<
        ResolversTypes['CreateLoggableEventMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationCreateLoggableEventArgs, 'input'>
    >;
    deleteEventLabel?: Resolver<
        ResolversTypes['DeleteEventLabelMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationDeleteEventLabelArgs, 'input'>
    >;
    deleteLoggableEvent?: Resolver<
        ResolversTypes['DeleteLoggableEventMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationDeleteLoggableEventArgs, 'input'>
    >;
    googleOAuthLoginMutation?: Resolver<
        ResolversTypes['GoogleOAuthLoginMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationGoogleOAuthLoginMutationArgs, 'input'>
    >;
    removeTimestampFromEvent?: Resolver<
        ResolversTypes['RemoveTimestampFromEventMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationRemoveTimestampFromEventArgs, 'input'>
    >;
    updateEventLabel?: Resolver<
        ResolversTypes['UpdateEventLabelMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationUpdateEventLabelArgs, 'input'>
    >;
    updateLoggableEvent?: Resolver<
        ResolversTypes['UpdateLoggableEventMutationPayload'],
        ParentType,
        ContextType,
        RequireFields<MutationUpdateLoggableEventArgs, 'input'>
    >;
}>;

export type QueryResolvers<
    ContextType = GraphQLContext,
    ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = ResolversObject<{
    loggedInUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
}>;

export type RemoveTimestampFromEventMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['RemoveTimestampFromEventMutationPayload'] = ResolversParentTypes['RemoveTimestampFromEventMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    loggableEvent?: Resolver<Maybe<ResolversTypes['LoggableEvent']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UpdateEventLabelMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['UpdateEventLabelMutationPayload'] = ResolversParentTypes['UpdateEventLabelMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    eventLabel?: Resolver<Maybe<ResolversTypes['EventLabel']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UpdateLoggableEventMutationPayloadResolvers<
    ContextType = GraphQLContext,
    ParentType extends
        ResolversParentTypes['UpdateLoggableEventMutationPayload'] = ResolversParentTypes['UpdateLoggableEventMutationPayload']
> = ResolversObject<{
    errors?: Resolver<Array<ResolversTypes['GenericApiError']>, ParentType, ContextType>;
    loggableEvent?: Resolver<Maybe<ResolversTypes['LoggableEvent']>, ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<
    ContextType = GraphQLContext,
    ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']
> = ResolversObject<{
    createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
    email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    eventLabels?: Resolver<Array<ResolversTypes['EventLabel']>, ParentType, ContextType>;
    googleId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
    loggableEvents?: Resolver<Array<ResolversTypes['LoggableEvent']>, ParentType, ContextType>;
    name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
    AddTimestampToEventMutationPayload?: AddTimestampToEventMutationPayloadResolvers<ContextType>;
    CreateEventLabelMutationPayload?: CreateEventLabelMutationPayloadResolvers<ContextType>;
    CreateLoggableEventMutationPayload?: CreateLoggableEventMutationPayloadResolvers<ContextType>;
    DateTime?: GraphQLScalarType;
    DeleteEventLabelMutationPayload?: DeleteEventLabelMutationPayloadResolvers<ContextType>;
    DeleteLoggableEventMutationPayload?: DeleteLoggableEventMutationPayloadResolvers<ContextType>;
    EventLabel?: EventLabelResolvers<ContextType>;
    GenericApiError?: GenericApiErrorResolvers<ContextType>;
    GoogleOAuthLoginMutationPayload?: GoogleOAuthLoginMutationPayloadResolvers<ContextType>;
    LoggableEvent?: LoggableEventResolvers<ContextType>;
    Mutation?: MutationResolvers<ContextType>;
    Query?: QueryResolvers<ContextType>;
    RemoveTimestampFromEventMutationPayload?: RemoveTimestampFromEventMutationPayloadResolvers<ContextType>;
    UpdateEventLabelMutationPayload?: UpdateEventLabelMutationPayloadResolvers<ContextType>;
    UpdateLoggableEventMutationPayload?: UpdateLoggableEventMutationPayloadResolvers<ContextType>;
    User?: UserResolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = GraphQLContext> = ResolversObject<{
    requireAuth?: RequireAuthDirectiveResolver<any, any, ContextType>;
    requireOwner?: RequireOwnerDirectiveResolver<any, any, ContextType>;
}>;
