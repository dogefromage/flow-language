import { useState, useEffect } from "react";

export function useDebouncedValue<T>(value: T, delay?: number, startingValue?: T) {
    const [ debouncedValue, setDebouncedValue ] = useState<T>();

    useEffect(() => {
        if (!delay) return;

        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => { clearTimeout(timer) }
    }, [ value, delay ]);

    return delay ? debouncedValue : value;
}
