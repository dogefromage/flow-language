import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { menusSetState, selectSingleMenu } from '../slices/menusSlice';
import { ColorTuple, FloatingMenuShape, Vec2 } from '../types';
import { colorTupleToHex } from '../utils/color';
import MenuRootFloating from './MenuRootFloating';
import { useAppDispatch } from '../redux/stateHooks';

interface ColorDivProps { color: string };

const ColorPickerDiv = styled.div.attrs<ColorDivProps>(({ color }) => ({
    style: { backgroundColor: color }
})) <ColorDivProps>`
    width: 100%;
    height: 100%;
    background-color: var(--color);

    /* makes outline darker version of input color */
    outline: solid 2px #00000044;
    outline-offset: -2px;

    &:hover {
        opacity: 0.8;
    }
`;

const COLOR_ELEMENT_KEY = 'color-input';

const colorPickerMenuShape: FloatingMenuShape = {
    type: 'floating',
    list: [
        {
            type: 'title',
            key: 'title',
            name: 'Color Picker',
            color: 'black',
        },
        {
            type: 'color',
            key: COLOR_ELEMENT_KEY,
            name: 'Color Wheel',
        }
    ]
}

interface Props {
    value: ColorTuple;
    onChange: (newColor: ColorTuple, actionToken: string) => void;
}

const FormColorPicker = ({ value, onChange }: Props) => {
    const dispatch = useAppDispatch();
    const [ menu, setMenu ] = useState<{
        anchor: Vec2;
        menuId: string;
    }>();
    const menuState = useSelector(selectSingleMenu(menu?.menuId));

    useEffect(() => {
        if (!menuState) return;
        const colorValue = menuState.state.get(COLOR_ELEMENT_KEY);
        if (colorValue == null) {
            // Menustate exists, no value present, set start value
            dispatch(menusSetState({
                menuId: menuState.id,
                key: COLOR_ELEMENT_KEY,
                value,
            }));
            return;
        }
        // value or something else has been updated
        onChange(colorValue, menuState.id);
    }, [ menuState ]);
    
    return (<>
        <ColorPickerDiv
            color={colorTupleToHex(value)}
            onClick={e => {
                const target = e.currentTarget as HTMLDivElement;
                const rect = target.getBoundingClientRect();
                setMenu({
                    anchor: { x: rect.left, y: rect.top },
                    menuId: `color-picker:${uuidv4()}`
                })
            }}
        /> {
            menu && 
            <MenuRootFloating
                menuId={menu.menuId}
                anchor={menu.anchor}
                menuType='misc'
                shape={colorPickerMenuShape}
                onClose={() => setMenu(undefined)}
            />
        }
    </>);
}

export default FormColorPicker;