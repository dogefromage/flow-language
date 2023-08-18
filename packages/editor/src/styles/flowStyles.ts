import styled, { css } from 'styled-components';
// import { DataTypes, SelectionStatus } from '../types';
// import { BORDER_RADIUS, BORDER_RADIUS_TOP, BOX_SHADOW } from './utils';
import { SelectionStatus, Vec2 } from '../types';

export const FLOW_NODE_ROW_HEIGHT = 24;
export const FLOW_NODE_MIN_WIDTH = 7 * FLOW_NODE_ROW_HEIGHT;

export interface FlowNodeDivProps {
    $position: Vec2;
    $selectionStatus: SelectionStatus;
    $debugOutlineColor?: string
}
export const FlowNodeDiv = styled.div.attrs<FlowNodeDivProps>(({ $position: position }) => ({
    style: {
        transform: `translate(${position.x}px, ${position.y}px)`,
    },
})) <FlowNodeDivProps>`

    position: absolute;
    top: 0;
    left: 0;
    min-width: ${FLOW_NODE_MIN_WIDTH}px;
        
    ${({ $selectionStatus: $selectionStatus, theme }) =>
        $selectionStatus !== SelectionStatus.Nothing && css`
            outline: solid calc(3px / min(var(--zoom), 1)) ${theme.colors.selectionStatus[$selectionStatus]};
    `}

    ${({ $debugOutlineColor: $debugOutlineColor }) => $debugOutlineColor && css`
        outline: 5px solid ${$debugOutlineColor};
        outline-offset: 5px;
    `}

    background-color: ${({ theme }) => theme.colors.flowEditor.nodeColor};

    cursor: pointer;
`;


export const FlowNodeRowDiv = styled.div`
    display: grid;
    grid-auto-rows: ${FLOW_NODE_ROW_HEIGHT}px;

    align-items: center;
    grid-template-columns: 100%;
    padding: 0 12px;
    position: relative;
`;

export const FlowNodeNameWrapper = styled(FlowNodeRowDiv) <{
    $backColor?: string;
}>`
    background-color: ${({ $backColor, theme }) => $backColor ?? theme.colors.flowEditor.defaultTitle};
    margin: 0;
    padding: 0 8px;
`;

// ${BORDER_RADIUS_TOP}


export const FlowNodeRowNameP = styled.p<{
    $align: 'right' | 'left';
    $bold?: boolean;
    $color?: string;
}>`
    width: 100%;
    height: ${FLOW_NODE_ROW_HEIGHT}px;
    margin: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: ${({ $align: align }) => align};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${({ $bold: bold }) => bold && `font-weight: bold;`}

    color: ${({ $color }) => $color || 'inherit'};
`;

export const FlowJointDiv = styled.div<{
    $direction: 'input' | 'output';
    $dataTypeTag: string;
    $isHovering: boolean;
    $additional?: boolean;
}>`
    position: absolute;
    top: ${0.5 * FLOW_NODE_ROW_HEIGHT}px;
    ${({ $direction: direction }) =>
        `${direction === 'input' ?
            'left' : 'right'}: -10px`
    };
    width: 20px;
    height: ${FLOW_NODE_ROW_HEIGHT}px;
    transform: translateY(-50%);
    
    /* background-color: #ff000033; */

    display: flex;
    align-items: center;
    justify-content: center;


    div {
        width: 14px;
        height: 14px;
        
        transition: transform 50ms, border 150ms, background-color 150ms;
        border: solid 2px #00000033;
        ${({ theme, $dataTypeTag }) => css`
            border: solid 2px ${theme.colors.jointStyles[$dataTypeTag].borderColor};
            background-color: ${theme.colors.jointStyles[$dataTypeTag].fillColor};
        `}
        
        ${({ $additional, theme, $dataTypeTag }) => $additional && css`
            border: dashed 2px ${theme.colors.jointStyles[$dataTypeTag].fillColor};
            background-color: transparent;
        `}

        ${({ $isHovering }) => $isHovering && `transform: scale(1.3);`}

        border-radius: 100%;
    }

    
    &:hover div {
        transform: scale(1.3);
    }
`;

interface MouseSelectionDivProps {
    $rect: { x: number, y: number, w: number, h: number };
}

export const MouseSelectionDiv = styled.div.attrs<MouseSelectionDivProps>(({ $rect: $rect }) => {
    return {
        style: {
            '--rect-x': `${$rect.x}px`,
            '--rect-y': `${$rect.y}px`,
            '--rect-w': `${$rect.w}px`,
            '--rect-h': `${$rect.h}px`,
        }
    };
}) <MouseSelectionDivProps>`
    position: absolute;

    z-index: 100;

    left:   var(--rect-x);
    top:    var(--rect-y);
    width:  var(--rect-w);
    height: var(--rect-h);

    background-color: #ffffff55;
    border: dashed 2px #111;
`;
