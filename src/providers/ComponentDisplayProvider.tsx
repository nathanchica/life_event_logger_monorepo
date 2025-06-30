import { createContext, useContext, useState, ReactNode } from 'react';
import invariant from 'tiny-invariant';

export enum AppTheme {
    Light = 'light',
    Dark = 'dark'
}

type ComponentDisplayContextType = {
    showLoginView: () => void;
    hideLoginView: () => void;
    loginViewIsShowing: boolean;
    showLoadingState: () => void;
    hideLoadingState: () => void;
    loadingStateIsShowing: boolean;
    theme: AppTheme;
    enableLightTheme: () => void;
    enableDarkTheme: () => void;
};

export const ComponentDisplayContext = createContext<ComponentDisplayContextType | null>(null);

export const useComponentDisplayContext = () => {
    const context = useContext(ComponentDisplayContext);
    invariant(context, 'This component must be wrapped by ComponentDisplayProvider');
    return context;
};

type Props = {
    offlineMode: boolean;
    children: ReactNode;
};

/**
 * ComponentDisplayProvider is a context provider that manages the display state of various components.
 * It provides methods to show/hide the login view, loading state, and to switch between light and dark themes.
 */
const ComponentDisplayProvider = ({ offlineMode, children }: Props) => {
    const [loginViewIsShowing, setLoginViewIsShowing] = useState(true);
    const showLoginView = () => setLoginViewIsShowing(true);
    const hideLoginView = () => setLoginViewIsShowing(false);

    const [loadingStateIsShowing, setLoadingStateIsShowing] = useState(!offlineMode);
    const showLoadingState = () => setLoadingStateIsShowing(true);
    const hideLoadingState = () => setLoadingStateIsShowing(false);

    const [theme, setTheme] = useState<AppTheme>(AppTheme.Light);
    const enableLightTheme = () => setTheme(AppTheme.Light);
    const enableDarkTheme = () => setTheme(AppTheme.Dark);

    const contextValue = {
        showLoginView,
        hideLoginView,
        loginViewIsShowing,
        showLoadingState,
        hideLoadingState,
        loadingStateIsShowing,
        theme,
        enableLightTheme,
        enableDarkTheme
    };

    return <ComponentDisplayContext.Provider value={contextValue}>{children}</ComponentDisplayContext.Provider>;
};

export default ComponentDisplayProvider;
