"use client";

import { useState, useEffect, useRef } from "react";

/**
 * A custom hook that persists state to localStorage.
 * Useful for simple UI preferences that don't need a full database.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(defaultValue);
    const hasInitialized = useRef(false);
    const defaultValueRef = useRef(defaultValue);

    // Update ref when defaultValue changes (but don't trigger effect)
    useEffect(() => {
        defaultValueRef.current = defaultValue;
    }, [defaultValue]);

    useEffect(() => {
        // Check if localStorage is available (not available in SSR or some build contexts)
        if (typeof window === "undefined" || !window.localStorage) {
            return;
        }

        // Only run once on mount
        if (hasInitialized.current) {
            return;
        }

        try {
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                setState(parsed);
            } else {
                // Initialize with default value if not present
                localStorage.setItem(key, JSON.stringify(defaultValueRef.current));
            }
        } catch (e) {
            console.error("Error parsing persisted state for key:", key, e);
            // Fallback to default value on error
            try {
                localStorage.setItem(key, JSON.stringify(defaultValueRef.current));
            } catch (e2) {
                console.error("Error setting default value for key:", key, e2);
            }
        } finally {
            hasInitialized.current = true;
        }
    }, [key]); // Only depend on key, not defaultValue

    const setPersistedState = (value: T | ((prev: T) => T)) => {
        const newValue = value instanceof Function ? value(state) : value;
        setState(newValue);
        
        // Persist to localStorage if available
        if (typeof window !== "undefined" && window.localStorage) {
            try {
                localStorage.setItem(key, JSON.stringify(newValue));
            } catch (e) {
                console.error(`Failed to persist state for key ${key}:`, e);
            }
        }
    };

    return [state, setPersistedState];
}
