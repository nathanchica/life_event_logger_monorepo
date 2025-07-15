import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import invariant from 'tiny-invariant';

import { User } from '../utils/types';

export type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isOfflineMode: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    setOfflineMode: (isOffline: boolean) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    invariant(context, 'This component must be used within an AuthProvider');
    return context;
};

export const offlineUser: User = {
    id: 'offline',
    name: 'Offline User',
    email: 'offline@user.com'
};

type Props = {
    children: ReactNode;
};

const AuthProvider = ({ children }: Props) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const setOfflineMode = (isOffline: boolean) => {
        setIsOfflineMode(isOffline);
        if (isOffline) {
            setUser(offlineUser);
            setToken('offline-token'); // Simulate an offline token

            // Add the offline parameter to the URL without redirecting
            const url = new URL(window.location.href);
            url.searchParams.set('offline', 'true');
            window.history.replaceState({}, '', url.toString());

            console.info('Application switched to offline mode.');
        }
    };

    useEffect(() => {
        // Check for offline URL parameter
        // istanbul ignore next - window is always defined in browser environment
        const hasOfflineInUrlParam = window ? new URLSearchParams(window.location.search).has('offline') : false;
        if (hasOfflineInUrlParam) {
            setOfflineMode(true);
            console.info('Application is in offline mode.');
        }

        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isOfflineMode,
        login,
        logout,
        setOfflineMode
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
