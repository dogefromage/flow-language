import { PropsWithChildren, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { Size, Vec2 } from '../types';
import useAdjustedAnchor from '../utils/useAdjustedAnchor';

interface ToolTipBoxDivProps {
    $anchor: Vec2;
}

const ToolTipBoxDiv = styled.div.attrs<ToolTipBoxDivProps>(({
    $anchor,
}) => ({
    style: {
        left: $anchor.x + 'px',
        top: $anchor.y + 'px',
    },
})) <ToolTipBoxDivProps>`
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

interface ToolTipBoxProps {
    anchor: Vec2;
    parentSize: Size;
}

const ToolTipBox = ({ children, anchor, parentSize }: PropsWithChildren<ToolTipBoxProps>) => {
    const divRef = useRef<HTMLDivElement>(null);
    const { adjustedAnchor } = useAdjustedAnchor(divRef, anchor, parentSize,
        { type: 'clip', sign: 1 },
        { type: 'flip', sign: -1 },
    );

    return (
        <ToolTipBoxDiv
            ref={divRef}
            $anchor={adjustedAnchor}
        >
            {children}
        </ToolTipBoxDiv>
    );
};

const RelativeDiv = styled.div`
    position: relative;
`;

interface ToolTipProps {
    tooltip: React.FC;
    hoverMillis?: number;
}

const ToolTipAnchor = ({ tooltip: ToolTipContent, children, hoverMillis }: PropsWithChildren<ToolTipProps>) => {
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
                    <ToolTipBox anchor={tooltip.anchor} parentSize={tooltip.parentSize}  >
                        <ToolTipContent />
                    </ToolTipBox>,
                    document.querySelector(`#tool-tip-portal-mount`)!
                )
            }
        </RelativeDiv>
    );
}

const ToolTipSectionDiv = styled.div`
    &:not(:first-child) {
        border-top: 1px solid var(--color-1);
    }
    padding: 0.25rem 0;
    p {
        white-space: normal;
    }
`;

const ToolTip = {
    Anchor: ToolTipAnchor,
    SectionDiv: ToolTipSectionDiv,
};

export default ToolTip; 
