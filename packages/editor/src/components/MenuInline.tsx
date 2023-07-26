import React, { useEffect } from 'react';
import { menusSetNode, selectSingleMenu } from '../slices/menusSlice';
import { MenuHorizontalExpandDiv as MenuInlineExpandDiv } from '../styles/MenuElementDiv';
import MenuInlineDiv from '../styles/MenuInlineDiv';
import { InlineMenuShape, MenuStackNode, Vec2 } from '../types';
import MenuFloating from './MenuFloating';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';

interface Props {
    menuId: string;
    depth: number;
    shape: InlineMenuShape;
}

const MenuInline = ({ menuId, depth, shape }: Props) => {
    const dispatch = useAppDispatch();
    const menu = useAppSelector(selectSingleMenu(menuId));
    if (!menu) return null;

    const currentStackEl = menu.nodeStack[depth] as MenuStackNode | undefined;

    return (
        <MenuInlineDiv> {
            shape.list.map(expandElement =>
                <MenuInlineExpandDiv
                    key={expandElement.name}
                    onMouseEnter={e => {
                        const div = e.currentTarget as HTMLDivElement;
                        if (!div) return;
                        const rect = div.getBoundingClientRect();
                        const leftAnchor: Vec2 = {
                            x: rect.left,
                            y: rect.bottom,
                        };
                        dispatch(menusSetNode({
                            menuId,
                            depth,
                            node: { key: expandElement.key, leftAnchor, parentWidth: 0, },
                        }));
                    }}
                >
                    { expandElement.name } {
                        currentStackEl?.key === expandElement.key &&
                        <MenuFloating
                            menuId={menuId}
                            depth={depth + 1}
                            shape={expandElement.sublist}
                            {...currentStackEl}
                        />
                    }
                </MenuInlineExpandDiv>
            )
        }
        </MenuInlineDiv>
    );
}

export default MenuInline;