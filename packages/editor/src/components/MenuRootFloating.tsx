import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { useAppDispatch } from '../redux/stateHooks';
import { menusSetClosed } from '../slices/menusSlice';
import { FloatingMenuShape, MenuTypes, Vec2 } from '../types';
import { useBindMenuState } from '../utils/menus';
import useClickedOutside from '../utils/useClickedOutside';
import useStopMouseEvents from '../utils/useStopMouseEvents';
import MenuFloating from './MenuFloating';

const FixedFullscreenDiv = styled.div`
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
`;

interface Props {
    menuId: string;
    menuType: MenuTypes;
    shape: FloatingMenuShape;
    initialFocusPath?: string;
    onClose: () => void;
    anchor: Vec2;
    desiredWidth?: number;
}

const MenuRootFloating = ({ menuId, menuType, shape, onClose, anchor, initialFocusPath, desiredWidth }: Props) => {

    const { menuState } = useBindMenuState(menuId, menuType, initialFocusPath);
    const wrapperDivRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (menuState?.isClosed) {
            onClose();
        }
    });

    const close = () => {
        dispatch(menusSetClosed({ menuId }));
    }
    useClickedOutside(wrapperDivRef, close);

    const stopMouseHandlers = useStopMouseEvents();

    return ReactDOM.createPortal(
        <FixedFullscreenDiv
            {...stopMouseHandlers}
            ref={wrapperDivRef}
        >
            {
                menuState &&
                <MenuFloating
                    menuId={menuId}
                    depth={0}
                    focusPath={[]}
                    shape={shape as FloatingMenuShape}
                    leftAnchor={anchor}
                    parentWidth={0}
                    desiredWidth={desiredWidth}
                />
            }
        </FixedFullscreenDiv>,
        document.querySelector(`#menu-portal-mount`)!
    );
}

export default MenuRootFloating;