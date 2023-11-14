import useResizeObserver from '@react-hook/resize-observer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { panelManagerSetActive, panelManagerSetClientRect } from '../slices/panelManagerSlice';
import { Rect, ViewProps } from '../types';
import { useAppDispatch } from '../redux/stateHooks';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { MaterialSymbol } from '../styles/icons';

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

const PanelBody = ({ children, viewProps }: Props) => {
    const { panelId, viewType } = viewProps;
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
            x: bounds.left, y: bounds.top, w: bounds.width, h: bounds.height,
        };
        dispatch(panelManagerSetClientRect({ panelId, rect }));
    });

    return (
        <PanelDiv ref={panelDiv} onMouseEnter={mouseEnter}>
            <ErrorBoundary FallbackComponent={PanelErrorFallback}>
                {children}
            </ErrorBoundary>
        </PanelDiv>
    );
}

export default PanelBody;

const ErrorFallbackDiv = styled.div`
    padding: 2rem;   
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    button {
        background-color: var(--color-1);
        padding: 0.25rem;
        border: none;
        outline: none;
        border-radius: var(--border-radius);
        cursor: pointer;
    }
`

const PanelErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    const [ show, setShow ] = useState(false);

    useEffect(() => {
        console.error(error);
        setTimeout(() => {
            setShow(true);
        }, 500)
    }, []);

    return (
        show &&
        <ErrorFallbackDiv>
            <h1>Error!</h1>
            <p>{error?.message || 'Unknown error.'}</p>
            <button onClick={resetErrorBoundary}>Retry loading panel.</button>
        </ErrorFallbackDiv>
    );
}