import React, { PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import useHover from '../utils/useHover';
import { RowComponentProps } from './FlowNodeRowComponents';
import { FlowNodeRowContextToolTip } from './FlowNodeToolTips';

const ErrorUnderlineDiv = styled.div<{ $hasErrors: boolean, $debugBackColor?: string }>`
    position: relative;

    ${({ $debugBackColor: debugBackColor }) => debugBackColor && css`
        &>div {
            background-color: ${debugBackColor};
        }
    `}

    ${({ $hasErrors }) => $hasErrors && css`
        --error-deco: red wavy underline;
    `}
`;

interface FlowNodeErrorWrapperProps {
    hasErrors: boolean;
    tooltip: JSX.Element;
}

export const FlowNodeErrorWrapper = ({ children, tooltip, hasErrors }: PropsWithChildren<FlowNodeErrorWrapperProps>) => {
    const { handlers, hovering } = useHover(700);
    return (
        <ErrorUnderlineDiv $hasErrors={hasErrors} {...handlers}>
            {children} 
            {hovering && tooltip}            
        </ErrorUnderlineDiv>
    );
}

export const FlowNodeRowErrorWrapper = (props: PropsWithChildren<RowComponentProps>) => {
    const { children, context } = props;
    return (
        <FlowNodeErrorWrapper
            hasErrors={!!context?.problems.length}
            tooltip={<FlowNodeRowContextToolTip {...props} />}
        >
            { children }
        </FlowNodeErrorWrapper>
    );
}
