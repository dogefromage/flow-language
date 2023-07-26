import useResizeObserver from '@react-hook/resize-observer';
import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
import { panelManagerSetActive, panelManagerSetClientRect } from '../slices/panelManagerSlice';
import { Rect, ViewProps } from '../types';
import { useAppDispatch } from '../redux/stateHooks';

const PanelDiv = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    background-color: var(--color-3);
`;

interface Props {
    children: React.ReactNode;
    viewProps: ViewProps;
}

const PanelBody = ({ children, viewProps: { panelId } }: Props) => {
    const dispatch = useAppDispatch();
    const panelDiv = useRef<HTMLDivElement>(null);

    const mouseEnter = useCallback(() => {
        if (!panelDiv.current) return;
        dispatch(panelManagerSetActive({
            activePanel: panelId,
        }))
    }, [dispatch]);

    useResizeObserver(panelDiv, div => {
        const bounds = div.target.getBoundingClientRect();
        const rect: Rect = {
            x: bounds.left,
            y: bounds.top,
            w: bounds.width,
            h: bounds.height
        }

        dispatch(panelManagerSetClientRect({
            panelId,
            rect,
        }));
    });

    return (
        <PanelDiv
            ref={panelDiv}
            onMouseEnter={mouseEnter}
        >
            {children}
        </PanelDiv>
    );
}

export default PanelBody;