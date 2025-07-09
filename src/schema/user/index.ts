import { Resolvers } from '../../generated/graphql';
import { EventLabelParent } from '../eventLabel';
import { LoggableEventParent } from '../loggableEvent';

export type UserParent = {
    id: string;
    googleId: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    loggableEvents: Array<LoggableEventParent>;
    eventLabels: Array<EventLabelParent>;
};

const resolvers: Resolvers = {
    Query: {
        user: async (_, __, { user }) => {
            return user;
        }
    },

    User: {
        loggableEvents: async (parent, _, { prisma }) => {
            return prisma.loggableEvent.findMany({
                where: { userId: parent.id },
                include: { labels: true }
            });
        },
        eventLabels: async (parent, _, { prisma }) => {
            return prisma.eventLabel.findMany({
                where: { userId: parent.id }
            });
        }
    }
};

export default resolvers;
