import { useRef, useState } from "react";

export default function useHover(millis = 0) {
    const [ hovering, setHovering ] = useState(false);
    const timeoutRef = useRef<number | undefined>();

    return {
        hovering,
        handlers: {
            onMouseEnter: (e: React.MouseEvent) => {
                if (timeoutRef.current == null) {
                    timeoutRef.current = setTimeout(() => {
                        setHovering(true);
                    }, millis);
                }
            },
            onMouseLeave: (e: React.MouseEvent) => {
                setHovering(false);
                if (timeoutRef != null) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = undefined;
                }
            },
        }
    }
}