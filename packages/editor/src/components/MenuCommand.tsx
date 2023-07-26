import React from 'react';
import { selectCommands } from '../slices/commandsSlice';
import { selectContextMenu } from '../slices/contextMenuSlice';
import { menusSetClosed, selectSingleMenu } from '../slices/menusSlice';
import { MenuCommandDiv } from '../styles/MenuElementDiv';
import { CommandMenuElement } from '../types';
import { MenuElementProps } from './MenuFloating';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { formatKeyCombination } from '../utils/keyCombinations';
import useDispatchCommand from '../utils/useDispatchCommand';

const MenuCommand = ({ menuId, element }: MenuElementProps<CommandMenuElement>) => {
    const dispatch = useAppDispatch();
    const menuState = useAppSelector(selectSingleMenu(menuId));
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
        if (!command || !menuState) return;
        dispatch(menusSetClosed({ menuId }));

        if (menuState.type === 'context') {
            if (!contextMenu) return;
            dispatchCommand(command.id, contextMenu.paramMap, 'contextmenu');
        }
        else if (menuState.type === 'toolbar') {
            dispatchCommand(command.id, {}, 'toolbar');
        }
        else {
            console.error(`Command not dispatched, menutype not found`);
        }
    }

    return (
        <MenuCommandDiv
            onClick={invoke}
            tabIndex={element.tabIndex}
        >
            { <p>{text}</p> }
            { info && <p>{info}</p> }
        </MenuCommandDiv>
    );
}

export default MenuCommand;