import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { menusSetNode, selectSingleMenu } from '../slices/menusSlice';
import { selectPanelManager } from '../slices/panelManagerSlice';
import MaterialSymbol from '../styles/MaterialSymbol';
import { MenuExpandDiv } from '../styles/MenuElementDiv';
import { ExpandMenuElement, MenuStackNode, Vec2 } from '../types';
import { useFocusMoveHandlers, useFocusNavigation } from '../utils/menus';
import MenuFloating, { MenuElementProps } from './MenuFloating';

const MenuExpand = ({ menuId, element, depth, focusPath, neightbourCount }: MenuElementProps<ExpandMenuElement>) => {
    const dispatch = useAppDispatch();
    const divRef = useRef<HTMLDivElement>(null);
    const panelManagerState = useAppSelector(selectPanelManager);
    const menu = useAppSelector(selectSingleMenu(menuId));

    const joinedPath = focusPath.join('.');
    useEffect(() => {
        if (menu.focusedPath == joinedPath) {
            divRef.current?.focus();
        }
    }, [ menu.focusedPath ]);

    const expand = () => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const leftAnchor: Vec2 = {
            x: rect.left,
            y: rect.top,
        };
        dispatch(menusSetNode({
            menuId,
            depth,
            node: { 
                key: element.key, 
                leftAnchor,
                parentWidth: rect.width,
            }
        }));
    }

    const handlers = useFocusNavigation(menuId, joinedPath, {
        // out: () => focusPath.slice(0, -1).join('.'),
        in: () => {
            expand();
            return [ ...focusPath, 0 ].join('.');
        },
        ...useFocusMoveHandlers(focusPath, neightbourCount),
    });
    
    const currentStackEl = menu.nodeStack[depth] as MenuStackNode | undefined;

    return (
        <MenuExpandDiv
            ref={divRef}
            onMouseEnter={expand}
            tabIndex={element.tabIndex}
            {...handlers}
        >
            <p>{element.name}</p>
            <MaterialSymbol $size={20}>chevron_right</MaterialSymbol> {
                currentStackEl?.key === element.key &&
                <MenuFloating
                    menuId={menuId}
                    depth={depth + 1}
                    focusPath={focusPath}
                    shape={element.sublist}
                    leftAnchor={currentStackEl.leftAnchor}
                    parentWidth={currentStackEl.parentWidth}
                />
            }
        </MenuExpandDiv>
    );
}

export default MenuExpand;