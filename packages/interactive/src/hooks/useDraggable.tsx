import React from "react"
import { setTransferData } from "../utils/dnd";

export function useDraggable<T extends {}>(props:
    {
        tag: string;
        start?: (e: React.DragEvent) => T | undefined;
        end?: (e: React.DragEvent) => void;
    }) {

    const onDragStart = (e: React.DragEvent) => {
        const transfer = props.start?.(e);
        setTransferData(e, props.tag, transfer);
        e.dataTransfer.setDragImage(new Image(), 0, 0);
    }

    const onDragEnd = (e: React.DragEvent) => {
        props.end?.(e);
    }

    return {
        handlers: {
            onDragStart,
            onDragEnd,
            draggable: true,
        }
    };
}