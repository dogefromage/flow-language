import styled, { css } from 'styled-components';
import { FlowJointStyling, SelectionStatus, Size2, Vec2 } from '../types';

export const FLOW_NODE_ROW_HEIGHT = 24;
export const FLOW_NODE_MIN_WIDTH = 7 * FLOW_NODE_ROW_HEIGHT;

export const FLOW_COMMENT_MIN_SIZE: Size2 = {
    w: FLOW_NODE_MIN_WIDTH,
    h: FLOW_NODE_ROW_HEIGHT,
};
export const FLOW_COMMENT_DEFAULT_COLOR_HEX = '#cccccc';

export interface FlowNodeCallDivProps {
    $position: Vec2;
    $selectionStatus: SelectionStatus;
}
export const FlowNodeCallDiv = styled.div.attrs<FlowNodeCallDivProps>(({ $position }) => ({
    style: {
        transform: `translate(${$position.x}px, ${$position.y}px)`,
    },
})) <FlowNodeCallDivProps>`

    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    min-width: ${FLOW_NODE_MIN_WIDTH}px;

    ${({ $selectionStatus, theme }) =>
        $selectionStatus !== 'nothing' && css`
            outline: solid calc(3px / min(var(--zoom), 1)) ${theme.colors.selectionStatus[$selectionStatus]};
    `}
    background-color: ${({ theme }) => theme.colors.flowEditor.nodeColor};

    cursor: pointer;
`;

export interface FlowNodeCommentDivProps {
    $position: Vec2;
    $size: Size2;
    $selectionStatus: SelectionStatus;
    $color: string;
}
export const FlowNodeCommentDiv = styled.div.attrs<FlowNodeCommentDivProps>(({ $position, $size }) => ({
    style: {
        transform: `translate(${$position.x}px, ${$position.y}px)`,
        width: `${$size.w}px`,
        height: `${$size.h}px`,
        ['--height-pixels']: $size.h,
    },
})) <FlowNodeCommentDivProps>`

    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    min-width: ${FLOW_COMMENT_MIN_SIZE.w}px;
    min-height: ${FLOW_COMMENT_MIN_SIZE.h}px;

    padding: 4px 8px;
    /* overflow: hidden; */

    background-color: color-mix(in srgb, 
        ${({ $color }) => $color } 35%, transparent);
        
    ${({ $selectionStatus, $color }) =>
        $selectionStatus !== 'nothing' && css`
            outline: solid calc(3px / min(var(--zoom), 1)) ${$color};
    `}

    p {
        line-break: normal;
    }

    .resize-icon {
        position: absolute;
        bottom: 0;
        right: 0;
        clip-path: polygon(100% 20%, 20% 100%, 100% 100%);
        /* clip-path: polygon(80% 0, 100% 0, 100% 100%, 0 100%, 0 80%); */
    }
    
    cursor: pointer;
`;


export const FlowNodeRowDiv = styled.div`
    display: grid;
    grid-auto-rows: ${FLOW_NODE_ROW_HEIGHT}px;

    align-items: center;
    grid-template-columns: 100%;
    padding: 0 12px;
    position: relative;
    
    p {
        text-decoration: var(--error-deco);
    }
`;

export const FlowNodeNameWrapper = styled(FlowNodeRowDiv) <{
    $backColor?: string;
}>`
    background-color: ${({ $backColor, theme }) => $backColor ?? theme.colors.flowEditor.defaultTitle};
    margin: 0;
    padding: 0 8px;
`;

export const FlowNodeRowNameP = styled.p<{
    $align: 'right' | 'left' | 'center';
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

    color: ${({ $color }) => $color || 'inherit'};
`;

export const FlowJointDiv = styled.div<{
    $direction: 'input' | 'output';
    $jointStyle: FlowJointStyling;
    $isHovering: boolean;
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


        ${({ $jointStyle }) => $jointStyle.background &&
        `background-color: ${$jointStyle.background};`
    }
        ${({ $jointStyle }) => $jointStyle.border &&
        `border: ${$jointStyle.borderStyle} 2px ${$jointStyle.border};`
    }
        ${({ $jointStyle }) => $jointStyle.shape === 'round' && 'border-radius: 100%;'}
        ${({ $isHovering }) => $isHovering && `transform: scale(1.3);`}
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
