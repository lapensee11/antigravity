"use client";

import { useState, useEffect } from "react";

/**
 * A custom hook that persists state to localStorage.
 * Useful for simple UI preferences that don't need a full database.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(defaultValue);

    useEffect(() => {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            try {
                setState(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing persisted state for key:", key, e);
            }
        }
    }, [key]);

    const setPersistedState = (value: T | ((prev: T) => T)) => {
        const newValue = value instanceof Function ? value(state) : value;
        setState(newValue);
        localStorage.setItem(key, JSON.stringify(newValue));
    };

    return [state, setPersistedState];
}
