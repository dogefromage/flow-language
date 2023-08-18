import React, { useEffect, useRef } from 'react';
import { menusSetClosed, menusSetState, selectSingleMenu } from '../slices/menusSlice';
import { MenuSearchDiv } from '../styles/MenuSearchDiv';
import { SearchMenuElement } from '../types';
import { MenuElementProps } from './MenuFloating';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { useFocusNavigation, useFocusMoveHandlers } from '../utils/menus';

const MenuSearch = ({ menuId, element, focusPath, neightbourCount }: MenuElementProps<SearchMenuElement>) => {
    const dispatch = useAppDispatch();
    const menu = useAppSelector(selectSingleMenu(menuId));
    const inputRef = useRef<HTMLInputElement>(null);
    
    const joinedPath = focusPath.join('.');
    useEffect(() => {
        if (menu.focusedPath == joinedPath) {
            inputRef.current?.focus();
            setTimeout(() => inputRef.current?.select(), 5);
        }
    }, [ menu.focusedPath ]);

    const handlers = useFocusNavigation(menuId, joinedPath, {
        ...useFocusMoveHandlers(focusPath, neightbourCount),
    });

    const searchValue = menu?.state.get(element.key) ?? '';

    return (
        <MenuSearchDiv>
            <form
                onSubmit={e => {
                    e.preventDefault();
                }}
            >
                <input
                    type='text'
                    value={searchValue}
                    ref={inputRef}
                    onChange={e => {
                        const target = e.currentTarget as HTMLInputElement;
                        dispatch(menusSetState({
                            menuId,
                            key: element.key,
                            value: target.value,
                        }))
                    }}
                    placeholder={element.placeholder}
                    autoComplete='off'
                    autoCorrect='off'
                    autoSave='off'
                    {...handlers}
                />
            </form>
        </MenuSearchDiv>
    );
}

export default MenuSearch;