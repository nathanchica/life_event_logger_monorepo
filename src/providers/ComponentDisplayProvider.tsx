import { createContext, useContext, useState, ReactNode } from 'react';
import invariant from 'tiny-invariant';

type ComponentDisplayContextType = {
    loggableEventEditorIsVisible: boolean;
    showLoggableEventEditor: (eventName: string) => void;
    hideLoggableEventEditor: () => void;
    loggableEventNameToEdit: string | null;
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
    const [loggableEventEditorIsVisible, setLoggableEventEditorIsVisible] = useState(false);
    const [loggableEventNameToEdit, setLoggableEventNameToEdit] = useState<string | null>(null);

    function showLoggableEventEditor(eventName: string) {
        setLoggableEventNameToEdit(eventName);
        setLoggableEventEditorIsVisible(true);
    }

    function hideLoggableEventEditor() {
        setLoggableEventEditorIsVisible(false);
        setLoggableEventNameToEdit(null);
    }

    const contextValue = {
        loggableEventEditorIsVisible,
        showLoggableEventEditor,
        hideLoggableEventEditor,
        loggableEventNameToEdit
    };

    return <ComponentDisplayContext.Provider value={contextValue}>{children}</ComponentDisplayContext.Provider>;
};

export default ComponentDisplayProvider;
