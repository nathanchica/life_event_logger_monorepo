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

type Props = {
    children: ReactNode;
};

const AuthProvider = ({ children }: Props) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    useEffect(() => {
        // Check for offline URL parameter
        const hasOfflineInUrlParam = window ? new URLSearchParams(window.location.search).has('offline') : false;
        if (hasOfflineInUrlParam) {
            setIsOfflineMode(true);
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
            console.info('Application switched to offline mode.');
        }
    };

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
