import React, { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectCommands } from '../slices/commandsSlice';
import { contextMenuClose, selectContextMenu } from '../slices/contextMenuSlice';
import { Command } from '../types';
import generateContextMenuShape from '../utils/generateContextMenuShape';
import MenuRootFloating from './MenuRootFloating';

const CONTEXT_MENU_ID = `context_menu`;

const ContextMenu = () => {
    const dispatch = useAppDispatch();
    const { contextMenu } = useAppSelector(selectContextMenu);
    const { commands } = useAppSelector(selectCommands);

    const menuShape = useMemo(() => {
        if (contextMenu == null) return;
        const commandList = contextMenu.commandIds
            .map(commandId => commands[commandId])
            .filter(command => command != null) as Command[];
        return generateContextMenuShape(commandList);
    }, [ contextMenu, commands ]);

    if (!menuShape || !contextMenu) return null;

    return (
        <MenuRootFloating
            menuId={CONTEXT_MENU_ID}
            menuType={'context'}
            shape={menuShape}
            onClose={() => {
                dispatch(contextMenuClose());
            }}
            anchor={contextMenu.position}
        />
    );
}

export default ContextMenu;