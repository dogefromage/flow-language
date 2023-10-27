import styled from 'styled-components';
import { Vec2 } from '../types';

export const FLOATING_MENU_WIDTH = 240;
export const MENU_ROW_HEIGHT = 26;

export const MenuInlineDiv = styled.div`
    display: flex;
    flex-direction: row;
    gap: 1ch;

    & > div {
        margin: 0;
    }
`;

export interface MenuFloatingDivProps {
    $anchor: Vec2;
    $outlineRed?: boolean;
    $menuWidth: number;
}

export const MenuFloatingDiv = styled.div.attrs<MenuFloatingDivProps>(({
    $anchor, $menuWidth,
}) => {
    return {
        style: {
            width: $menuWidth + 'px',
            left: $anchor.x + 'px',
            top: $anchor.y + 'px',
        },
    };
}) <MenuFloatingDivProps>`
    position: fixed;

    padding: 0.25rem 4px;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    max-height: 600px;

    overflow-y: auto;
    overflow-y: overlay;

    background-color: var(--color-2);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    outline: solid 1px #00000077;

    z-index: 1;

    ::-webkit-scrollbar {
        width: 8px;
    }
    /* ::-webkit-scrollbar-track {
        background: #f1f1f1;
    } */
    ::-webkit-scrollbar-thumb {
        --color: #aaa;
        border-radius: 10px;
        box-shadow: inset 0 0 4px 4px var(--color);
        border: solid 2px transparent;

        &:hover {
            background: var(--color);
        }
    }

    /* hides element briefly */
    @keyframes become-visible {
        to   { visibility: visible; }
    }
    visibility: hidden;
    animation: become-visible 10ms 10ms linear infinite alternate;
`;


export interface MenuElementDivProps {
    tabIndex?: number;
    $outlinedRed?: boolean;
}

export const MenuElementDiv = styled.div.attrs<MenuElementDivProps>(({ tabIndex }) => ({
    tabIndex: tabIndex ?? -1,
}))<MenuElementDivProps>`
    position: relative;
    width: 100%;
    height: ${MENU_ROW_HEIGHT}px;
    flex-shrink: 0;
    
    /* margin-top: 0.25rem; */

    padding: 0 0.5rem;
    display: grid;
    align-items: center;
    
    border-radius: var(--border-radius);
    cursor: pointer;

    ${({$outlinedRed}) => $outlinedRed && 'outline: 1px solid red;'}

    &:hover,
    &:focus {
        background-color: var(--color-1);
    }

    &:focus {
        outline: solid 1px #aaa;
    }

    p {
        margin: 0;
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

`;

export const MenuDividerDiv = styled.div`
    width: 100%;
    height: 0;
    border-top: 1px solid var(--color-3);
`;

export const MenuCommandDiv = styled(MenuElementDiv)`
    grid-template-columns: auto 1fr;
    & > :nth-child(2) {
        text-align: right;  
        opacity: 0.7;
        overflow: hidden;
    }
`;

export const MenuExpandDiv = styled(MenuCommandDiv)``;

export const MenuInlineExpandDiv = styled(MenuElementDiv)`
    width: auto;
`;

export const MenuSearchDiv = styled(MenuElementDiv)`
    &:hover {
        background-color: unset;
    }

    form {
        input
        {
            width: 100%;
            height: ${MENU_ROW_HEIGHT}px;

            outline: none;
            border: none;
            padding: 0 1rem;
            
            border-radius: var(--border-radius);

            background-color: var(--color-3);
            box-shadow: inset 2px 2px #00000033;

            font-weight: normal;
            font-size: 1rem;
        }
    }
`;

export const MenuTitleDiv = styled.div<{ $backColor?: string }>`

    width: calc(100% + 0.5rem);
    margin: -0.25rem;
    margin-bottom: 0;

    height: calc(${MENU_ROW_HEIGHT}px + 0.25rem);
    flex-shrink: 0;

    border-radius: var(--border-radius-top);

    background-color: ${({ $backColor }) => $backColor || '#444' };
    color: white;

    display: flex;
    align-items: center;

    p
    {
        margin: 0;
        padding: 0 0.75rem;
        font-weight: bold;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;


export const MENU_COLOR_WHEEL_INNER_HEIGHT = 160;

export const MenuColorWheelDiv = styled.div`
    width: 100%;
    padding: 0.5rem;
    display: grid;
    grid-template-rows: auto ${MENU_COLOR_WHEEL_INNER_HEIGHT}px;
    grid-template-columns: ${MENU_COLOR_WHEEL_INNER_HEIGHT}px auto;
    gap: 0.5rem;

    justify-items: center;
    align-items: center;
`;

export const MenuColorSliderWrapperDiv = styled.div`
    height: 100%;
    width: 50px;
    position: relative;
`;

interface MenuColorValueSliderProps { maxValue: string }

export const MenuColorValueSliderInput = styled.input.attrs<MenuColorValueSliderProps>(({ maxValue }) => ({
    type: 'range',
    min: 0, max: 100, step: 0.1,
    style: {
        '--max-value': maxValue,
    },
}))<MenuColorValueSliderProps>`
    
    width: ${MENU_COLOR_WHEEL_INNER_HEIGHT}px;
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