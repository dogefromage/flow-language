import { useRef } from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { selectPanelManager } from '../slices/panelManagerSlice';
import MenuFloatingDiv, { VERTICAL_MENU_WIDTH } from '../styles/MenuFloatingDiv';
import { ButtonMenuElement, ColorMenuElement, CommandMenuElement, ExpandMenuElement, FloatingMenuShape, MenuElement, SearchMenuElement, TitleMenuElement, Vec2 } from '../types';
import useAdjustedAnchor from '../utils/useAdjustedAnchor';
import MenuButton from './MenuButton';
import MenuColor from './MenuColor';
import MenuCommand from './MenuCommand';
import MenuExpand from './MenuExpand';
import MenuSearch from './MenuSearch';
import MenuTitle from './MenuTitle';

export type MenuElementProps<M extends MenuElement = MenuElement> = {
    menuId: string;
    depth: number;
    focusPath: number[];
    neightbourCount: number;
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
    focusPath: number[];
    shape: FloatingMenuShape;
    leftAnchor: Vec2;
    parentWidth: number;
    desiredWidth?: number;
}

const MenuFloating = ({ menuId, depth, shape, leftAnchor, parentWidth, focusPath, desiredWidth }: Props) => {
    const panelManagerState = useAppSelector(selectPanelManager);
    const { rootClientRect } = panelManagerState;

    const divRef = useRef<HTMLDivElement>(null);
    const { adjustedAnchor } = useAdjustedAnchor(divRef, leftAnchor, 
        { w: parentWidth, h: 0 }, 
        { type: 'flip', sign: 1 },
        { type: 'clip', sign: 1 },
    );

    return (
        <MenuFloatingDiv 
            ref={divRef} 
            $anchor={adjustedAnchor}
            $menuWidth={desiredWidth ?? VERTICAL_MENU_WIDTH}
            $maxHeight={rootClientRect.h}
        >{
            shape.list.map((element, elementIndex) =>
                <MenuElementSwitch
                    menuId={menuId}
                    key={element.key}
                    depth={depth}
                    element={element}
                    focusPath={[...focusPath, elementIndex]}
                    neightbourCount={shape.list.length}
                />
            )
        }
        </MenuFloatingDiv>
    );
}

export default MenuFloating;