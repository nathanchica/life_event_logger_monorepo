import { createContext, useContext, useState, ReactNode } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import invariant from 'tiny-invariant';

type AppTheme = 'light' | 'dark';

export type ViewOptionsContextType = {
    theme: AppTheme;
    enableLightTheme: () => void;
    enableDarkTheme: () => void;
    activeEventLabelId: string | null;
    setActiveEventLabelId: (id: string | null) => void;
};

export const ViewOptionsContext = createContext<ViewOptionsContextType | null>(null);

export const useViewOptions = () => {
    const context = useContext(ViewOptionsContext);
    invariant(context, 'This component must be wrapped by ViewOptionsProvider');
    return context;
};

type Props = {
    children: ReactNode;
};

/**
 * ViewOptionsProvider is a context provider that manages the display state of various components.
 */
const ViewOptionsProvider = ({ children }: Props) => {
    // Detect OS preference for dark mode
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [theme, setTheme] = useState<AppTheme>(prefersDarkMode ? 'dark' : 'light');
    const enableLightTheme = () => setTheme('light');
    const enableDarkTheme = () => setTheme('dark');

    const [activeEventLabelId, setActiveEventLabelId] = useState<string | null>(null);

    const contextValue = {
        theme,
        enableLightTheme,
        enableDarkTheme,
        activeEventLabelId,
        setActiveEventLabelId
    };

    return <ViewOptionsContext.Provider value={contextValue}>{children}</ViewOptionsContext.Provider>;
};

export default ViewOptionsProvider;
