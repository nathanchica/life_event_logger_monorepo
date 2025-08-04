import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

import invariant from 'tiny-invariant';

import { tokenStorage } from '../apollo/tokenStorage';
import { User } from '../utils/types';

export type AuthContextType = {
    user: User | null;
    isOfflineMode: boolean;
    isInitializing: boolean;
    setAuthData: (accessToken: string, user: User) => void;
    clearAuthData: () => void;
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

/**
 * AuthProvider is a context provider that manages authentication state
 */
const AuthProvider = ({ children }: Props) => {
    const [user, setUser] = useState<User | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const setAuthData = useCallback((accessToken: string, userData: User) => {
        tokenStorage.setAccessToken(accessToken);
        setUser(userData);
        // Only store non-sensitive user info for UX after page refresh
        sessionStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const clearAuthData = useCallback(() => {
        // Clear everything locally
        setUser(null);
        tokenStorage.clear();
        sessionStorage.removeItem('user');

        setIsOfflineMode(false);

        // Remove the offline parameter from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete('offline');
        window.history.replaceState({}, '', url.toString());
    }, []);

    const setOfflineMode = (isOffline: boolean) => {
        setIsOfflineMode(isOffline);
        if (isOffline) {
            setUser(offlineUser);
            tokenStorage.setAccessToken('offline-token');

            // Add the offline parameter to the URL without redirecting
            const url = new URL(window.location.href);
            url.searchParams.set('offline', 'true');
            window.history.replaceState({}, '', url.toString());

            console.info('Application switched to offline mode.');
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            setIsInitializing(true);

            // Check for offline URL parameter
            // istanbul ignore next - window is always defined in browser environment
            const hasOfflineInUrlParam = window ? new URLSearchParams(window.location.search).has('offline') : false;
            if (hasOfflineInUrlParam) {
                setOfflineMode(true);
                console.info('Application is in offline mode.');
                setIsInitializing(false);
                return;
            }

            // Only restore user info from sessionStorage (not token)
            const storedUser = sessionStorage.getItem('user');

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                } catch (error) {
                    console.error('Error parsing stored user data:', error);
                    sessionStorage.removeItem('user');
                }
            }

            setIsInitializing(false);
        };

        initAuth();
    }, []);

    const value = {
        user,
        isOfflineMode,
        isInitializing,
        setAuthData,
        clearAuthData,
        setOfflineMode
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
