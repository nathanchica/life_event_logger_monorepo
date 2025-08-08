import { useState, useCallback } from 'react';

/**
 * Custom hook for managing boolean toggle state
 * @param initialValue - Initial boolean value (default: false)
 * @returns Object with value and toggle functions
 */
export const useToggle = (initialValue = false) => {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => setValue((prevValue) => !prevValue), []);
    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);

    return {
        value,
        toggle,
        setTrue,
        setFalse,
        setValue
    };
};
