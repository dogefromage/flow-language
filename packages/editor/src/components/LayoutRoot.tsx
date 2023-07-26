import useResizeObserver from '@react-hook/resize-observer';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../redux/stateHooks';
import { panelManagerSetRootClientRect } from '../slices/panelManagerSlice';
import LayoutToolbar from './LayoutToolbar';
import LayoutViewRoot from './LayoutViewRoot';

const Wrapper = styled.div`
    width: 100%;
    height: 100vh;

    display: grid;
    grid-template-rows: auto 1fr;

    & > :first-child {
        border-bottom: solid 1px black;
    }

    background-color: var(--color-3);
`;

const LayoutRoot = () => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();

    const setSize = (w: number, h: number) => {
        requestAnimationFrame(() => {
            dispatch(panelManagerSetRootClientRect({
                rect: {
                    x: 0, y: 0, w, h,
                }
            }));
        })
    }

    useResizeObserver(wrapperRef, observer => {
        setSize(observer.contentRect.width, observer.contentRect.height)
    });

    useEffect(() => {
        const clientRect = wrapperRef.current?.getBoundingClientRect();
        clientRect && setSize(clientRect.width, clientRect.height);
    }, []);

    return (
        <Wrapper
            onContextMenu={e => e.preventDefault()}
            ref={wrapperRef}
        >
            <LayoutToolbar />
            <LayoutViewRoot />
        </Wrapper>
    );
}

export default LayoutRoot;