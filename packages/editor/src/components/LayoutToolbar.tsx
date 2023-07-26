import React from 'react';
import toolbarShape from '../content/menus/toolbar.json';
import { InlineMenuShape } from '../types';
import MenuRootInline from './MenuRootInline';

interface Props {

}

const LayoutToolbar = ({}: Props) => {
    return (
        <MenuRootInline
            menuId='layout'
            menuType={'toolbar'}
            shape={toolbarShape as InlineMenuShape}
        />
    );
}

export default LayoutToolbar;