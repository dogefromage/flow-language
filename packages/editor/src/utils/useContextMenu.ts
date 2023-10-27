import React from "react";
import { useAppDispatch } from "../redux/stateHooks";
import { contextMenuOpen } from "../slices/contextMenuSlice";
import { CustomCommandParams, Vec2 } from "../types";

export default function useContextMenu(
    panelId: string,
    menuName: string,
    commandIds: string[],
    paramMapCallback?: (e: React.MouseEvent) => CustomCommandParams,
) {
    const dispatch = useAppDispatch();

    const openContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const clientCursor: Vec2 = {
            x: e.clientX,
            y: e.clientY,
        };

        const paramMap = paramMapCallback?.(e) || {};

        dispatch(contextMenuOpen({ contextMenu: {
            panelId,
            name: menuName,
            clientCursor,
            commandIds,
            paramMap,
        }}));
    }

    return openContextMenu;
}