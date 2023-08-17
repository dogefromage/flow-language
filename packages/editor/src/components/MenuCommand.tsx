import React, { useEffect, useRef } from 'react';
import { selectCommands } from '../slices/commandsSlice';
import { selectContextMenu } from '../slices/contextMenuSlice';
import { menusSetClosed, selectSingleMenu } from '../slices/menusSlice';
import { MenuCommandDiv } from '../styles/MenuElementDiv';
import { CommandMenuElement } from '../types';
import { MenuElementProps } from './MenuFloating';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { formatKeyCombination } from '../utils/keyCombinations';
import useDispatchCommand from '../utils/useDispatchCommand';
import { useFocusNavigation, useFocusMoveHandlers } from '../utils/menus';

const MenuCommand = ({ menuId, element, focusPath, neightbourCount }: MenuElementProps<CommandMenuElement>) => {
    const dispatch = useAppDispatch();
    const divRef = useRef<HTMLDivElement>(null);
    const menu = useAppSelector(selectSingleMenu(menuId));
    const { contextMenu } = useAppSelector(selectContextMenu);
    const { commands } = useAppSelector(selectCommands);
    const dispatchCommand = useDispatchCommand();

    let text = element.command;
    let info = '';

    const command = commands[element.command];
    if (command != null) {
        text = command.name;
        const keyComb = command.keyCombinations?.[0];
        if (keyComb) {
            info = formatKeyCombination(keyComb);
        }
    }

    const invoke = () => {
        if (!command || !menu) return;
        dispatch(menusSetClosed({ menuId }));

        if (menu.type === 'context') {
            if (!contextMenu) return;
            dispatchCommand(command.id, contextMenu.paramMap, 'contextmenu');
        }
        else if (menu.type === 'toolbar') {
            dispatchCommand(command.id, {}, 'toolbar');
        }
        else {
            console.error(`Command not dispatched, menutype not found`);
        }
    }

    const joinedPath = focusPath.join('.');
    useEffect(() => {
        if (menu.focusedPath == joinedPath) {
            divRef.current?.focus();
        }
    }, [ menu.focusedPath ]);

    const handlers = useFocusNavigation(menuId, joinedPath, {
        out: () => focusPath.slice(0, -1).join('.'),
        submit: invoke,
        ...useFocusMoveHandlers(focusPath, neightbourCount),
    });

    return (
        <MenuCommandDiv
            ref={divRef}
            onClick={invoke}
            tabIndex={element.tabIndex}
            {...handlers}
        >
            { <p>{text}</p> }
            { info && <p>{info}</p> }
        </MenuCommandDiv>
    );
}

export default MenuCommand;