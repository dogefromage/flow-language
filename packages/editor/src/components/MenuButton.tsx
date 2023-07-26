import React from 'react';
import { menusSetClosed } from '../slices/menusSlice';
import { MenuElementDiv } from '../styles/MenuElementDiv';
import { ButtonMenuElement } from '../types';
import { MenuElementProps } from './MenuFloating';
import { useAppDispatch } from '../redux/stateHooks';

const MenuButton = ({ menuId, element }: MenuElementProps<ButtonMenuElement>) => {
    const dispatch = useAppDispatch();
    return (
        <MenuElementDiv
            onClick={e => {
                dispatch(menusSetClosed({ menuId }));
                element.onClick(e);
            }}
            tabIndex={element.tabIndex}
        > {
            <p>{element.name}</p>
        }
        </MenuElementDiv>
    );
}

export default MenuButton;