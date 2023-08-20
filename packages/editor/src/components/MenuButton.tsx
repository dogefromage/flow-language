import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { menusSetClosed, selectSingleMenu } from '../slices/menusSlice';
import { MenuElementDiv } from '../styles/MenuElementDiv';
import { ButtonMenuElement } from '../types';
import { useFocusMoveHandlers, useFocusNavigation } from '../utils/menus';
import { MenuElementProps } from './MenuFloating';

// function useFocusNavigate(
//     // ref: React.RefObject<HTMLElement>,
//     focusPath: number[],
// ) {
//     return {
//         handlers: {
//             onKeyDown: (e: React.KeyboardEvent) => {
//                 console.log(focusPath.join('.'));
//                 console.log(e.code);
//             }
//         }
//     }
// }

const MenuButton = ({ menuId, element, focusPath, neightbourCount }: MenuElementProps<ButtonMenuElement>) => {
    const dispatch = useAppDispatch();
    const divRef = useRef<HTMLDivElement>(null);
    const menu = useAppSelector(selectSingleMenu(menuId));

    const joinedPath = focusPath.join('.');
    useEffect(() => {
        if (menu.focusedPath == joinedPath) {
            divRef.current?.focus();
        }
    }, [menu.focusedPath]);

    const submit = () => {
        dispatch(menusSetClosed({ menuId }));
        element.onClick();
    }

    const handlers = useFocusNavigation(menuId, joinedPath, {
        out: () => focusPath.slice(0, -1).join('.'),
        submit,
        ...useFocusMoveHandlers(focusPath, neightbourCount),
    });

    return (
        <MenuElementDiv
            onClick={e => {
                submit();
                e.stopPropagation();
            }}
            tabIndex={element.tabIndex}
            ref={divRef}
            {...handlers}
        > {
                <p>{element.name}</p>
            }
        </MenuElementDiv>
    );
}

export default MenuButton;