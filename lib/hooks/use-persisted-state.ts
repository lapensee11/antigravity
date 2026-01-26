import { useState, useEffect } from "react";

export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // 1. Initialize state with initialValue to avoid hydration mismatch
    const [state, setState] = useState<T>(initialValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // 2. Load from localStorage on mount (Client-side only)
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setState(JSON.parse(item));
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        }
        setIsLoaded(true);
    }, [key]);

    // 3. Wrap setState to update localStorage
    const setPersistedState = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore =
                value instanceof Function ? value(state) : value;

            setState(valueToStore);

            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [state, setPersistedState];
}
