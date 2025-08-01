import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

import invariant from 'tiny-invariant';

import { tokenStorage } from '../apollo/tokenStorage';
import { useAuthMutations } from '../hooks/useAuthMutations';
import { User } from '../utils/types';

export type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isOfflineMode: boolean;
    isInitializing: boolean;
    login: (googleToken: string) => Promise<boolean>;
    logout: () => void;
    setOfflineMode: (isOffline: boolean) => void;
    refreshAuth: () => Promise<boolean>;
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
    const [isInitializing, setIsInitializing] = useState(true);

    const { loginMutation, refreshTokenMutation, logoutMutation } = useAuthMutations();

    const login = useCallback(
        async (googleToken: string): Promise<boolean> => {
            try {
                const { data } = await loginMutation({
                    variables: {
                        input: {
                            googleToken,
                            clientType: 'WEB'
                        }
                    }
                });

                if (data?.googleOAuthLoginMutation?.accessToken) {
                    const { accessToken, user } = data.googleOAuthLoginMutation;
                    setToken(accessToken);
                    tokenStorage.setAccessToken(accessToken);
                    setUser(user);
                    // Only store non-sensitive user info for UX after page refresh
                    sessionStorage.setItem('user', JSON.stringify(user));
                    return true;
                } else if (data?.googleOAuthLoginMutation?.errors?.length > 0) {
                    console.error('Login error:', data.googleOAuthLoginMutation.errors[0].message);
                }
            } catch (error) {
                console.error('Login failed:', error);
            }
            return false;
        },
        [loginMutation]
    );

    const logout = useCallback(async () => {
        try {
            await logoutMutation();
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear everything locally
        setToken(null);
        setUser(null);
        tokenStorage.clear();
        sessionStorage.removeItem('user');

        setIsOfflineMode(false);

        // Remove the offline parameter from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete('offline');
        window.history.replaceState({}, '', url.toString());
    }, [logoutMutation]);

    const refreshAuth = useCallback(async (): Promise<boolean> => {
        try {
            const { data } = await refreshTokenMutation();

            if (data?.refreshTokenMutation?.accessToken) {
                const newToken = data.refreshTokenMutation.accessToken;
                setToken(newToken);
                tokenStorage.setAccessToken(newToken);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        return false;
    }, [refreshTokenMutation]);

    const setOfflineMode = (isOffline: boolean) => {
        setIsOfflineMode(isOffline);
        if (isOffline) {
            setUser(offlineUser);
            setToken('offline-token'); // Simulate an offline token
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
                    // Try to refresh token on page load
                    const refreshed = await refreshAuth();
                    if (!refreshed) {
                        // Session expired, clear user data
                        sessionStorage.removeItem('user');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error parsing stored user data:', error);
                    sessionStorage.removeItem('user');
                }
            }

            setIsInitializing(false);
        };

        initAuth();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isOfflineMode,
        isInitializing,
        login,
        logout,
        setOfflineMode,
        refreshAuth
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
