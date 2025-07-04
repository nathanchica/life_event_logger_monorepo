import { User, UserGQL } from '../utils/types';

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

const mockUserGQL: UserGQL = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User'
};

export const createMockUserGQL = (overrides: Partial<UserGQL> = {}): UserGQL => {
    return {
        ...mockUserGQL,
        ...overrides
    };
};
