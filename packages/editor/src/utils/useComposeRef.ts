import { ForwardedRef, useEffect, useRef } from "react";
// https://github.com/facebook/react/issues/24722

export default function useComposeRef<T>(
    ref: ForwardedRef<T>,
    initialValue: any = null
) {
    const targetRef = useRef<T>(initialValue);

    useEffect(() => {
        if (!ref) return;

        if (typeof ref === 'function') {
            ref(targetRef.current);
        } else {
            ref.current = targetRef.current;
        }
    }, [ref]);

    return targetRef;
};