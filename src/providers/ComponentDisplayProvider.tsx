import { createContext, useContext, useState, ReactNode } from 'react';
import invariant from 'tiny-invariant';

type ComponentDisplayContextType = {
    showLoggableEventEditor: (eventName: string) => void;
    hideLoggableEventEditor: () => void;
    loggableEventNameToEdit: string | null;
    showLoadingSpinner: () => void;
    hideLoadingSpinner: () => void;
    loadingSpinnerIsVisible: boolean;
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
    const [loggableEventNameToEdit, setLoggableEventNameToEdit] = useState<string | null>(null);
    const [loadingSpinnerIsVisible, setLoadingSpinnerIsVisible] = useState(true);

    function showLoggableEventEditor(eventName: string) {
        setLoggableEventNameToEdit(eventName);
    }

    function hideLoggableEventEditor() {
        setLoggableEventNameToEdit(null);
    }

    const contextValue = {
        showLoggableEventEditor,
        hideLoggableEventEditor,
        loggableEventNameToEdit,
        showLoadingSpinner: () => setLoadingSpinnerIsVisible(true),
        hideLoadingSpinner: () => setLoadingSpinnerIsVisible(false),
        loadingSpinnerIsVisible
    };

    return <ComponentDisplayContext.Provider value={contextValue}>{children}</ComponentDisplayContext.Provider>;
};

export default ComponentDisplayProvider;
