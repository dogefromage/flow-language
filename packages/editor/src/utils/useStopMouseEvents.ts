import React from "react";

const cancel = (e: React.MouseEvent | React.UIEvent) => e.stopPropagation();

type DivProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export default function(): Partial<DivProps> {
    return {
        onMouseDown:   cancel,
        onMouseUp:     cancel,
        onWheel:       cancel,
        onClick:       cancel,
        onDoubleClick: cancel,
    }
}