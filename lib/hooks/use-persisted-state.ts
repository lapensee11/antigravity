import { useState, useEffect, useRef, useCallback } from "react";

export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, boolean] {
    // 1. Initialize state with initialValue to avoid hydration mismatch
    const [state, setState] = useState<T>(initialValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // Ref to store the latest state for the debounced sync
    const stateRef = useRef(state);
    stateRef.current = state;

    // 2. Load from localStorage on mount (Client-side only)
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                const parsed = JSON.parse(item);
                setState(parsed);
                stateRef.current = parsed;
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        }
        setIsLoaded(true);
    }, [key]);

    // 3. Debounced Sync to LocalStorage
    useEffect(() => {
        if (!isLoaded) return;

        const timer = setTimeout(() => {
            try {
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(stateRef.current));
                }
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [state, key, isLoaded]);

    const setPersistedState = useCallback((value: T | ((val: T) => T)) => {
        setState(prev => {
            return value instanceof Function ? value(prev) : value;
        });
    }, []);

    return [state, setPersistedState, isLoaded];
}
