import React from 'react';
import { MenuTitleDiv } from '../styles/MenuTitleDiv';
import { TitleMenuElement } from '../types';
import { MenuElementProps } from './MenuFloating';

const MenuTitle = ({ element }: MenuElementProps<TitleMenuElement>) => {
    return (
        <MenuTitleDiv
            $backColor={element.color}
        >
            <p>{element.name}</p>
        </MenuTitleDiv>
    );
}

export default MenuTitle;