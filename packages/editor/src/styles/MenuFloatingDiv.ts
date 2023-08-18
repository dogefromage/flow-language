import styled from 'styled-components';
import { Vec2 } from '../types';

export const VERTICAL_MENU_WIDTH = 240;

export interface MenuVerticalDivProps {
    $anchor: Vec2;
    width?: string;
    $maxHeight: number;
    $outlineRed?: boolean;
}

const MenuVerticalDiv = styled.div.attrs<MenuVerticalDivProps>(({
    $anchor, width
}) => {
    return {
        style: {
            width,
            left: $anchor.x + 'px',
            top: $anchor.y + 'px',
        },
    };
}) <MenuVerticalDivProps>`
    position: fixed;

    padding: 0 4px 4px;
    display: flex;
    flex-direction: column;

    width: ${VERTICAL_MENU_WIDTH}px;
    max-height: ${({ $maxHeight }) => (Math.min($maxHeight, 600)) + 'px'};

    overflow-y: auto;
    overflow-y: overlay;

    background-color: var(--color-2);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    outline: solid 1px #00000077;

    /* ${({$outlineRed}) => $outlineRed && 'outline: 1px solid red;'} */

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
`;

export default MenuVerticalDiv;