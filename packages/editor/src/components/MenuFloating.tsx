import useResizeObserver from '@react-hook/resize-observer';
import React, { useMemo, useRef, useState } from 'react';
import { selectPanelManager } from '../slices/panelManagerSlice';
import MenuFloatingDiv, { VERTICAL_MENU_WIDTH } from '../styles/MenuFloatingDiv';
import MenuButton from './MenuButton';
import MenuColor from './MenuColor';
import MenuCommand from './MenuCommand';
import MenuExpand from './MenuExpand';
import MenuSearch from './MenuSearch';
import MenuTitle from './MenuTitle';
import { useAppSelector } from '../redux/stateHooks';
import { MenuElement, ButtonMenuElement, CommandMenuElement, ExpandMenuElement, TitleMenuElement, SearchMenuElement, ColorMenuElement, FloatingMenuShape, Vec2, Rect, Size } from '../types';

export type MenuElementProps<M extends MenuElement = MenuElement> = {
    menuId: string;
    depth: number;
    element: M;
}

const MenuElementSwitch = (props: MenuElementProps) => {
    const type = props.element.type;
    if (type === 'button')
        return <MenuButton {...props as MenuElementProps<ButtonMenuElement>} />
    if (type === 'command')
        return <MenuCommand {...props as MenuElementProps<CommandMenuElement>} />
    if (type === 'expand')
        return <MenuExpand  {...props as MenuElementProps<ExpandMenuElement>} />
    if (type === 'title')
        return <MenuTitle  {...props as MenuElementProps<TitleMenuElement>} />
    if (type === 'search')
        return <MenuSearch  {...props as MenuElementProps<SearchMenuElement>} />
    if (type === 'color')
        return <MenuColor  {...props as MenuElementProps<ColorMenuElement>} />
    
    console.error(`Unknown menu element: ${type}`);
    return null;
}

interface Props {
    menuId: string;
    depth: number;
    shape: FloatingMenuShape;
    leftAnchor: Vec2;
    parentWidth: number;
}

const margin = 8; // px

type HorizontalPos = { x: number, anchorDir: 'left' | 'right' };
function adjustHorizontally(leftX: number, parentWidth: number, menuWidth: number, availableSpace: Rect): HorizontalPos {
    // TODO: keep going into same direction as before if possible

    if (leftX + parentWidth + menuWidth < availableSpace.w) {
        // must go left
        return { x: leftX + parentWidth, anchorDir: 'right' };
    }
    // go right
    return { x: leftX - menuWidth, anchorDir: 'left' };
}

function adjustVertically(preferredY: number, menuHeight: number, availableSpace: Rect): number {
    // TODO consider case where menu too large (interpolate from cursor.y)

    if (preferredY + menuHeight > availableSpace.y + (availableSpace.h - margin)) {
        return availableSpace.y + (availableSpace.h - margin) - menuHeight;
    }
    return preferredY;
}

const MenuFloating = ({ menuId, depth, shape, leftAnchor, parentWidth }: Props) => {
    const panelManagerState = useAppSelector(selectPanelManager);
    const { rootClientRect } = panelManagerState;

    const divRef = useRef<HTMLDivElement>(null);
    const [ menuSize, setMenuSize ] = useState<Size>({ w: VERTICAL_MENU_WIDTH, h: 0 });

    const adjustedAnchor = useMemo(() => ({
            ...adjustHorizontally(leftAnchor.x, parentWidth, menuSize.w, rootClientRect),
            y: adjustVertically(leftAnchor.y, menuSize.h, rootClientRect),
        }),
        [ rootClientRect, leftAnchor, parentWidth, menuSize ],
    );

    useResizeObserver(divRef, observer => {
        const paddingAndBorderPixels = 4;
        setMenuSize({
            w: observer.contentRect.width + 2 * paddingAndBorderPixels,
            h: observer.contentRect.height + 2 * paddingAndBorderPixels,
        });
    });

    return (
        <MenuFloatingDiv 
            ref={divRef} 
            $anchor={adjustedAnchor}
            $maxHeight={rootClientRect.h}
        >{
            shape.list.map(element =>
                <MenuElementSwitch
                    menuId={menuId}
                    key={element.key}
                    depth={depth}
                    element={element}
                />
            )
        }
        </MenuFloatingDiv>
    );
}

export default MenuFloating;