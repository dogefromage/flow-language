import useResizeObserver from "@react-hook/resize-observer";
import { useMemo, useState } from "react";
import { useAppSelector } from "../redux/stateHooks";
import { selectPanelManager } from "../slices/panelManagerSlice";
import { Size2, Vec2 } from "../types";
import { assertNever } from "noodle-language";

const AVAIL_MARGIN = 8;
const SIZE_MARGIN = 4;

function adjustFlip(
    availableStart: number, availableSize: number,
    preferredPos: number,
    currentSize: number, parentSize: number,
    sign: number,
): number {
    // TODO: keep going into same direction as before if possible

    const leftOpt = preferredPos - currentSize;
    const rightOpt = preferredPos + parentSize;

    const canLeft = preferredPos - currentSize > availableStart;
    const canRight = preferredPos + parentSize + currentSize < availableSize;

    if (canLeft && !canRight) {
        return leftOpt;
    }
    if (canRight && !canLeft) {
        return rightOpt;
    }
    if (sign >= 0) {
        return rightOpt;
    }
    return leftOpt;
}

function adjustClip(
    availableStart: number, availableSize: number,
    preferredPos: number,
    currentSize: number, parentSize: number,
    sign: number,
): number {
    // TODO consider case where menu too large (interpolate from cursor.y or scroll)
    if (sign < 0) {
        preferredPos -= currentSize;
    }

    const min = availableStart + AVAIL_MARGIN;
    const max = availableStart + availableSize - 2 * AVAIL_MARGIN - currentSize;

    preferredPos = Math.max(min, preferredPos);
    preferredPos = Math.min(preferredPos, max);

    return preferredPos;
}

export type AnchorAdjustmentStrategy =
    | { type: 'none' }
    | { type: 'clip', sign: number }
    | { type: 'flip', sign: number }

function adjustPosition(
    availableStart: number, availableSize: number,
    preferredPos: number,
    currentSize: number, parentSize: number,
    strategy: AnchorAdjustmentStrategy,
) {
    switch (strategy.type) {
        case 'none':
            return preferredPos;
        case 'clip':
            return adjustClip(availableStart, availableSize,
                preferredPos, currentSize, parentSize, strategy.sign);
        case 'flip':
            return adjustFlip(availableStart, availableSize,
                preferredPos, currentSize, parentSize, strategy.sign);
    }
    assertNever();
}

export default function useAdjustedAnchor(
    ref: React.RefObject<HTMLElement>,
    baseAnchor: Vec2, parentSize: Size2,
    horizontalStragegy: AnchorAdjustmentStrategy,
    verticalStrategy: AnchorAdjustmentStrategy,
) {
    const panelManagerState = useAppSelector(selectPanelManager);
    const { rootClientRect: root } = panelManagerState;

    const [menuSize, setMenuSize] = useState<Size2>({ w: 0, h: 0 });

    const adjustedAnchor = useMemo(() => ({
        x: adjustPosition(root.x, root.w, baseAnchor.x, menuSize.w, parentSize.w, horizontalStragegy),
        y: adjustPosition(root.y, root.h, baseAnchor.y, menuSize.h, parentSize.h, verticalStrategy),
    }), [
        root.x, root.y, root.w, root.h,
        baseAnchor.x, baseAnchor.y,
        menuSize.w, menuSize.h,
        parentSize.w, parentSize.h,
    ]);

    useResizeObserver(ref, observer => {
        setMenuSize({
            w: observer.contentRect.width + 2 * SIZE_MARGIN,
            h: observer.contentRect.height + 2 * SIZE_MARGIN,
        });
    });

    return { adjustedAnchor };
}
