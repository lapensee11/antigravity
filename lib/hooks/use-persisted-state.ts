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
                    const raw = JSON.stringify(stateRef.current);
                    window.localStorage.setItem(key, raw);
                    window.dispatchEvent(new CustomEvent("antigravity-storage", { detail: { key } }));
                }
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [state, key, isLoaded]);

    // 4. Listen for external changes (other tabs or other hooks)
    useEffect(() => {
        const handleStorageChange = (e: any) => {
            if (e.type === "storage" && e.key !== key) return;
            if (e.type === "antigravity-storage" && e.detail?.key !== key) return;

            try {
                const item = window.localStorage.getItem(key);
                if (item) {
                    const parsed = JSON.parse(item);
                    // Simple equality check to avoid loops/unnecessary renders
                    if (JSON.stringify(parsed) !== JSON.stringify(stateRef.current)) {
                        setState(parsed);
                        stateRef.current = parsed;
                    }
                }
            } catch (error) {
                // ignore
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("antigravity-storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("antigravity-storage", handleStorageChange);
        };
    }, [key]);

    const setPersistedState = useCallback((value: T | ((val: T) => T)) => {
        setState(prev => {
            const newValue = value instanceof Function ? value(prev) : value;
            stateRef.current = newValue; // Update ref immediately for debouncer
            return newValue;
        });
    }, []);

    return [state, setPersistedState, isLoaded];
}
