import React, { useEffect, useRef } from 'react';
import { menusSetState, selectSingleMenu } from '../slices/menusSlice';
import { MenuSearchDiv } from '../styles/MenuSearchDiv';
import { SearchMenuElement } from '../types';
import { MenuElementProps } from './MenuFloating';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';

const MenuSearch = ({ menuId, element }: MenuElementProps<SearchMenuElement>) => {
    const dispatch = useAppDispatch();
    const menuState = useAppSelector(selectSingleMenu(menuId));

    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!element.autofocus) return;
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50)
    }, [inputRef]);

    const searchValue = menuState?.state.get(element.key) ?? '';

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
                />
            </form>
        </MenuSearchDiv>
    );
}

export default MenuSearch;