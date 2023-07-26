import React from 'react';
import { menusSetNode, selectSingleMenu } from '../slices/menusSlice';
import { selectPanelManager } from '../slices/panelManagerSlice';
import { MenuExpandDiv } from '../styles/MenuElementDiv';
import { ExpandMenuElement, MenuStackNode, Vec2 } from '../types';
import MenuFloating, { MenuElementProps } from './MenuFloating';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import MaterialSymbol from '../styles/MaterialSymbol';

const MenuExpand = ({ menuId, element, depth }: MenuElementProps<ExpandMenuElement>) => {
    const dispatch = useAppDispatch();
    const panelManagerState = useAppSelector(selectPanelManager);
    const { rootClientRect } = panelManagerState;
    const menu = useAppSelector(selectSingleMenu(menuId));
    if (!menu) return null;
    
    const currentStackEl = menu.nodeStack[depth] as MenuStackNode | undefined;

    return (
        <MenuExpandDiv
            onMouseEnter={e => {
                const div = e.currentTarget as HTMLDivElement;
                if (!div) return;
                const rect = div.getBoundingClientRect();
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
            }}
            tabIndex={element.tabIndex}
        >
            <p>{element.name}</p>
            <MaterialSymbol $size={20}>chevron_right</MaterialSymbol> {
                currentStackEl?.key === element.key &&
                <MenuFloating
                    menuId={menuId}
                    depth={depth + 1}
                    shape={element.sublist}
                    leftAnchor={currentStackEl.leftAnchor}
                    parentWidth={currentStackEl.parentWidth}
                />
            }
        </MenuExpandDiv>
    );
}

export default MenuExpand;