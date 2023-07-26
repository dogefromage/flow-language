import React, { useRef, useState } from "react"
import { getTransferData } from "../utils/dnd";

export function useDroppable<T extends {}>(props:
    {
        tag: string;
        enter?: (e: React.DragEvent, transfer: T) => void;
        over?: (e: React.DragEvent, transfer: T) => void;
        leave?: (e: React.DragEvent, transfer: T) => void;
        drop?: (e: React.DragEvent, transfer: T) => void;
    }) {
        
    const [isHovering, setIsHovering] = useState(false);

    const depthCounterRef = useRef(0);

    const onDragEnter = (e: React.DragEvent) => {
        const transfer = getTransferData<T>(e, props.tag);
        if (!transfer) return;

        depthCounterRef.current++;

        props.enter?.(e, transfer);
    }

    const onDragOver = (e: React.DragEvent) => {
        const transfer = getTransferData<T>(e, props.tag);
        if (!transfer) return;

        props.over?.(e, transfer);

        if (e.isDefaultPrevented()) {
            setIsHovering(true);
        }
    }

    const onDragLeave = (e: React.DragEvent) => {
        const transfer = getTransferData<T>(e, props.tag);
        if (!transfer) return;

        depthCounterRef.current--;
        if (depthCounterRef.current <= 0) {
            depthCounterRef.current = 0;
            setIsHovering(false);
        }

        props.leave?.(e, transfer);
    }

    const onDrop = (e: React.DragEvent) => {
        const transfer = getTransferData<T>(e, props.tag);
        if (!transfer) return;

        setIsHovering(false);
        depthCounterRef.current = 0;

        props.drop?.(e, transfer);
    }

    return {
        handlers: {
            onDragEnter,
            onDragOver,
            onDragLeave,
            onDrop,
        },
        isHovering,
    };
}