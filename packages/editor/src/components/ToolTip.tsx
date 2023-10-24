import { PropsWithChildren, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { Size, Vec2 } from '../types';
import useAdjustedAnchor from '../utils/useAdjustedAnchor';

const RelativeDiv = styled.div`
    position: relative;
`;

export type ToolTipContentComponent = () => React.JSX.Element;

interface ToolTipProps {
    tooltip: ToolTipContentComponent;
    hoverMillis?: number;
}

export const ToolTipAnchor = ({ tooltip: ToolTipContent, children, hoverMillis }: PropsWithChildren<ToolTipProps>) => {
    const [tooltip, setTooltip] = useState<{ anchor: Vec2, parentSize: Size }>();
    const timeoutRef = useRef<number | undefined>();

    hoverMillis ||= 500;

    return (
        <RelativeDiv
            onMouseEnter={e => {
                if (timeoutRef.current == null) {
                    const bounds = e.currentTarget.getBoundingClientRect();
                    const anchor = { x: bounds.left, y: bounds.top };
                    const parentSize = { w: bounds.width, h: bounds.height };

                    timeoutRef.current = setTimeout(
                        () => setTooltip({ anchor, parentSize }), hoverMillis);
                }
            }}
            onMouseLeave={e => {
                setTooltip(undefined);
                if (timeoutRef != null) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = undefined;
                }
            }}
        >
            {
                children
            }{
                tooltip &&
                ReactDOM.createPortal(
                    <ToolTipContainer anchor={tooltip.anchor} parentSize={tooltip.parentSize}  >
                        <ToolTipContent />
                    </ToolTipContainer>,
                    document.querySelector(`#tool-tip-portal-mount`)!
                )
            }
        </RelativeDiv>
    );
}

interface ToolTipContainerDivProps {
    $anchor: Vec2;
}

const ToolTipContainerDiv = styled.div.attrs<ToolTipContainerDivProps>(({
    $anchor,
}) => ({
    style: {
        left: $anchor.x + 'px',
        top: $anchor.y + 'px',
    },
})) <ToolTipContainerDivProps>`
    position: absolute;
    width: max-content;
    max-width: 600px;
    
    padding: 0.125rem 0.5rem;

    background-color: var(--color-3);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    border: 1px solid var(--color-1);

    opacity: 0;
    @keyframes enter {
        from { 
            opacity: 0%;
            /* transform: translateY(10px); */
        }
        to { 
            opacity: 100%;
            /* transform: none; */
        }
    }
    animation: enter 40ms 10ms ease forwards;

    p {
        word-wrap: break-word;
    }
`;

interface ToolTipContainerProps {
    anchor: Vec2;
    parentSize: Size;
}

export const ToolTipContainer = ({ children, anchor, parentSize }: PropsWithChildren<ToolTipContainerProps>) => {
    const divRef = useRef<HTMLDivElement>(null);
    const { adjustedAnchor } = useAdjustedAnchor(divRef, anchor, parentSize,
        { type: 'clip', sign: 1 },
        { type: 'flip', sign: -1 },
    );

    return (
        <ToolTipContainerDiv
            ref={divRef}
            $anchor={adjustedAnchor}
        >
            {children}
        </ToolTipContainerDiv>
    );
};

export const ToolTipSectionDiv = styled.div`
    :not(:first-child) {
        border-top: 1px solid var(--color-1);
    }
    padding: 0.25rem 0;
`;
