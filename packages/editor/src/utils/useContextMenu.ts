import React from "react";
import { useAppDispatch } from "../redux/stateHooks";
import { contextMenuOpen } from "../slices/contextMenuSlice";
import { CommandParameterMap, Vec2 } from "../types";

export default function useContextMenu(
    panelId: string,
    menuName: string,
    commandIds: string[],
    paramMapCallback?: (e: React.MouseEvent) => CommandParameterMap,
) {
    const dispatch = useAppDispatch();

    const openContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const position: Vec2 = {
            x: e.clientX,
            y: e.clientY,
        };

        const paramMap = paramMapCallback?.(e) || {};

        dispatch(contextMenuOpen({ contextMenu: {
            panelId,
            name: menuName,
            position,
            commandIds,
            paramMap: {
                ...paramMap,
                clientCursor: {
                    x: e.clientX,
                    y: e.clientY,
                }
            },
        }}));
    }

    return openContextMenu;
}