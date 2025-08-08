import { renderHook, act } from '@testing-library/react';

import { useToggle } from '../useToggle';

describe('useToggle', () => {
    it('initializes with default value of false', () => {
        const { result } = renderHook(() => useToggle());

        expect(result.current.value).toBe(false);
    });

    it('initializes with provided initial value', () => {
        const { result } = renderHook(() => useToggle(true));

        expect(result.current.value).toBe(true);
    });

    it('toggles value from false to true', () => {
        const { result } = renderHook(() => useToggle(false));

        act(() => {
            result.current.toggle();
        });

        expect(result.current.value).toBe(true);
    });

    it('toggles value from true to false', () => {
        const { result } = renderHook(() => useToggle(true));

        act(() => {
            result.current.toggle();
        });

        expect(result.current.value).toBe(false);
    });

    it('toggles value multiple times', () => {
        const { result } = renderHook(() => useToggle(false));

        act(() => {
            result.current.toggle();
        });
        expect(result.current.value).toBe(true);

        act(() => {
            result.current.toggle();
        });
        expect(result.current.value).toBe(false);

        act(() => {
            result.current.toggle();
        });
        expect(result.current.value).toBe(true);
    });

    it('sets value to true with setTrue', () => {
        const { result } = renderHook(() => useToggle(false));

        act(() => {
            result.current.setTrue();
        });

        expect(result.current.value).toBe(true);
    });

    it('keeps value true when setTrue is called multiple times', () => {
        const { result } = renderHook(() => useToggle(false));

        act(() => {
            result.current.setTrue();
        });
        expect(result.current.value).toBe(true);

        act(() => {
            result.current.setTrue();
        });
        expect(result.current.value).toBe(true);
    });

    it('sets value to false with setFalse', () => {
        const { result } = renderHook(() => useToggle(true));

        act(() => {
            result.current.setFalse();
        });

        expect(result.current.value).toBe(false);
    });

    it('keeps value false when setFalse is called multiple times', () => {
        const { result } = renderHook(() => useToggle(true));

        act(() => {
            result.current.setFalse();
        });
        expect(result.current.value).toBe(false);

        act(() => {
            result.current.setFalse();
        });
        expect(result.current.value).toBe(false);
    });

    it('sets value directly with setValue', () => {
        const { result } = renderHook(() => useToggle(false));

        act(() => {
            result.current.setValue(true);
        });
        expect(result.current.value).toBe(true);

        act(() => {
            result.current.setValue(false);
        });
        expect(result.current.value).toBe(false);
    });

    it('provides stable function references', () => {
        const { result, rerender } = renderHook(() => useToggle(false));

        const initialToggle = result.current.toggle;
        const initialSetTrue = result.current.setTrue;
        const initialSetFalse = result.current.setFalse;

        rerender();

        expect(result.current.toggle).toBe(initialToggle);
        expect(result.current.setTrue).toBe(initialSetTrue);
        expect(result.current.setFalse).toBe(initialSetFalse);
    });
});
