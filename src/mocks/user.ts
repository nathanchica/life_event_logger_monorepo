import { User, UserFragment } from '../utils/types';

const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User'
};

export const createMockUser = (overrides: Partial<User> = {}): User => {
    return {
        ...mockUser,
        ...overrides
    };
};

const mockUserFragment: UserFragment = {
    __typename: 'User',
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User'
};

export const createMockUserFragment = (overrides: Partial<UserFragment> = {}): UserFragment => {
    return {
        ...mockUserFragment,
        ...overrides
    };
};
