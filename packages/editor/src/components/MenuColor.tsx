import { hexToHsva, HsvaColor, hsvaToHex, Wheel } from '@uiw/react-color';
import React from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { menusSetState, selectSingleMenu } from '../slices/menusSlice';
import { ColorMenuElement } from '../types';
import { MenuElementProps } from './MenuFloating';

const INNER_HEIGHT = 160;

const ColorPickerDiv = styled.div`
    width: 100%;
    padding: 0.5rem;
    display: grid;
    grid-template-rows: auto ${INNER_HEIGHT}px;
    grid-template-columns: ${INNER_HEIGHT}px auto;
    gap: 0.5rem;

    justify-items: center;
    align-items: center;
`;

const SliderWrapperDiv = styled.div`
    height: 100%;
    width: 50px;
    position: relative;
`;

interface ValueSliderProps { maxValue: string }

const ValueSliderInput = styled.input.attrs<ValueSliderProps>(({ maxValue }) => ({
    type: 'range',
    min: 0, max: 100, step: 0.1,
    style: {
        '--max-value': maxValue,
    },
}))<ValueSliderProps>`
    width: ${INNER_HEIGHT}px;
    height: 1.6rem;

    position: absolute;
    top: calc(50% - 0.8rem);
    left: 50%;
    transform: translate(-50%) rotate(-90deg);

    appearance: none;
    outline: none;
    background-image: linear-gradient(-90deg, var(--max-value), black);

    outline: solid 2px #00000044;
    outline-offset: -2px;

    cursor: pointer;

    &::-webkit-slider-thumb {
        appearance: none;
        width: 5px;
        height: 1.2rem;
        background-color: transparent;
        outline: solid 2px white;
        border-radius: 3px;
    }

    &::-moz-range-thumb {
        width: 5px;
        height: 1.2rem;
        background-color: transparent;
        outline: solid 2px white;
        border-radius: 3px;
    }
`;

const MenuColor = ({ menuId, element }: MenuElementProps<ColorMenuElement>) => {
    const dispatch = useAppDispatch();
    const menuState = useAppSelector(selectSingleMenu(menuId));
    const hexColor: string = menuState?.state.get(element.key) ?? '#ffffff';
    const hsvaColor = hexToHsva(hexColor);

    const setHexColor = (hexColor: string) => {
        dispatch(menusSetState({ 
            menuId,
            key: element.key,
            value: hexColor,
        }));
    }

    const setColorValue = (newValue: number) => {
        const newHsva: HsvaColor = {
            ...hsvaColor,
            v: newValue,
        }
        setHexColor(hsvaToHex(newHsva));
    }

    const value = hsvaColor.v;
    const maxValueHex = hsvaToHex({ ...hsvaColor, v: 100 });

    return (
        <ColorPickerDiv>
            <p>Hue/Saturation</p>
            <p>Value</p>
            <Wheel
                width={INNER_HEIGHT}
                height={INNER_HEIGHT}
                color={hexColor}
                onChange={colorResult => setHexColor(colorResult.hex)}
            />
            <SliderWrapperDiv>
                <ValueSliderInput 
                    maxValue={maxValueHex} 
                    value={value ?? 0} 
                    onChange={e => {
                        const value = (e.target as HTMLInputElement).valueAsNumber;
                        setColorValue(value);
                    }}
                />
            </SliderWrapperDiv>
        </ColorPickerDiv>
    );
}

export default MenuColor;