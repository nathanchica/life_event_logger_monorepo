import { createContext, useContext, useState, ReactNode } from 'react';
import invariant from 'tiny-invariant';

type ComponentDisplayContextType = {
    showLoginView: () => void;
    hideLoginView: () => void;
    loginViewIsShowing: boolean;
    showLoadingState: () => void;
    hideLoadingState: () => void;
    loadingStateIsShowing: boolean;
};

export const ComponentDisplayContext = createContext<ComponentDisplayContextType | null>(null);

export const useComponentDisplayContext = () => {
    const context = useContext(ComponentDisplayContext);
    invariant(context, 'This component must be wrapped by ComponentDisplayProvider');
    return context;
};

type Props = {
    children: ReactNode;
};

const ComponentDisplayProvider = ({ children }: Props) => {
    const [loginViewIsShowing, setLoginViewIsShowing] = useState(true);
    const showLoginView = () => setLoginViewIsShowing(true);
    const hideLoginView = () => setLoadingStateIsShowing(false);

    const [loadingStateIsShowing, setLoadingStateIsShowing] = useState(true);
    const showLoadingState = () => setLoadingStateIsShowing(true);
    const hideLoadingState = () => {
        setTimeout(() => {
            setLoadingStateIsShowing(false);
        }, 1000);
    };

    const contextValue = {
        showLoginView,
        hideLoginView,
        loginViewIsShowing,
        showLoadingState,
        hideLoadingState,
        loadingStateIsShowing
    };

    return <ComponentDisplayContext.Provider value={contextValue}>{children}</ComponentDisplayContext.Provider>;
};

export default ComponentDisplayProvider;
