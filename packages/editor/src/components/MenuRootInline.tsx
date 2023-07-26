import React, { useEffect, useRef } from 'react';
import { menusSetClosed } from '../slices/menusSlice';
import { InlineMenuShape, MenuTypes } from '../types';
import MenuInline from './MenuInline';
import { useBindMenuState } from '../utils/menus';
import { useAppDispatch } from '../redux/stateHooks';
import useClickedOutside from '../utils/useClickedOutside';

interface Props {
    menuId: string;
    menuType: MenuTypes;
    shape: InlineMenuShape;
}

const MenuRootInline = ({ menuId, menuType, shape }: Props) => {
    const { menuState, resetMenuState } = useBindMenuState(menuId, menuType);
    const wrapperDivRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (menuState?.isClosed) {
            resetMenuState();
        }
    });

    useClickedOutside(wrapperDivRef, () => {
        if (menuState?.nodeStack.length) {
            dispatch(menusSetClosed({ menuId }));
        }
    });

    return (
        <div ref={wrapperDivRef}>
            <MenuInline
                menuId={menuId}
                shape={shape as InlineMenuShape}
                depth={0}
            />
        </div>
    )
}

export default MenuRootInline;