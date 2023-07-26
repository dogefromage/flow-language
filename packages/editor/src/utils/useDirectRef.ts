import { useRef } from "react";

export function useDirectRef<T>(t: T) {
    const ref = useRef(t);
    ref.current = t;
    return ref;
}