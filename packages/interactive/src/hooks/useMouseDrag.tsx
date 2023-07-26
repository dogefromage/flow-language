import React, { useRef, useState } from "react";
import { Dragzone } from "../components/Dragzone";

interface MouseDragInteraction {
    mouseButton: number,
    start: (e: React.MouseEvent, cancel: () => void) => void;
    move: (e: React.MouseEvent) => void;
    end: (e: React.MouseEvent) => void;
}

interface MouseDragOptions {
    cursor: string;
    deadzone: number,
}

export function useMouseDrag(
    interactions: Partial<MouseDragInteraction> | Partial<MouseDragInteraction>[],
    options?: Partial<MouseDragOptions>
) {
    const interactionArr = Array.isArray(interactions) ? interactions : [interactions];

    const [dragging, setDragging] = useState(false);
    const moveRef = useRef({
        activeInteractions: [] as number[],
        mouseDown: false,
        startPos: {
            x: 0,
            y: 0,
        }
    });

    const start = (e: React.MouseEvent) => {
        const activeInteractions: number[] = [];

        for (let i = 0; i < interactionArr.length; i++) {
            const interaction = interactionArr[i];

            if (interaction.mouseButton != null && e.button !== interaction.mouseButton) {
                continue;
            }

            let out = { cancelFlag: false };
            interaction.start?.(e, () => { out.cancelFlag = true });
            if (out.cancelFlag) {
                continue;
            }
            activeInteractions.push(i);
        }

        moveRef.current = {
            activeInteractions,
            mouseDown: activeInteractions.length > 0,
            startPos: { x: e.clientX, y: e.clientY },
        };
    };

    const moveFirst = (e: React.MouseEvent) => {
        if (moveRef.current.mouseDown) {
            const deltaMove = Math.hypot(
                moveRef.current.startPos.x - e.clientX,
                moveRef.current.startPos.y - e.clientY,
            );

            if (options?.deadzone && deltaMove < options.deadzone) {
                return;
            }

            setDragging(true);
            moveRef.current.mouseDown = false;
        }
    }

    const cancel = (e: React.MouseEvent) => {
        moveRef.current.mouseDown = false;
    }

    const zoneMove = (e: React.MouseEvent) => {
        if (moveRef.current.mouseDown) return;

        for (const index of moveRef.current.activeInteractions) {
            const interaction = interactionArr[index];
            interaction.move?.(e);
        }
    }

    const zoneEnd = (e: React.MouseEvent) => {
        if (moveRef.current.mouseDown) return;

        for (const index of moveRef.current.activeInteractions) {
            const interaction = interactionArr[index];
            interaction.end?.(e);
        }
        setDragging(false);
    }

    return {
        handlers: {
            onMouseDown: start,
            onMouseMove: moveFirst,
            onMouseUp: cancel,
        },
        catcher: (
            dragging ? (
                <Dragzone
                    onMouseMove={zoneMove}
                    onMouseUp={zoneEnd}
                    onMouseLeave={zoneEnd}
                    cursor={options?.cursor}
                />
            ) : null
        )
    }
}