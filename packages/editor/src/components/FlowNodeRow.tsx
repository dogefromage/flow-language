import React, { PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import useHover from '../utils/useHover';
import { RowComponentProps } from './FlowNodeRowComponents';
import FlowNodeRowContextToolTip from './FlowNodeRowContextToolTip';

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

const FlowNodeRowContextWrapper = (props: PropsWithChildren<RowComponentProps>) => {
    const { context, children } = props;
    const { handlers, hovering } = useHover(700);

    const hasErrors = !!context?.problems.length;

    return (
        <ErrorUnderlineDiv
            $hasErrors={hasErrors}
            // onMouseEnter={(hasErrors) => {
                // hasErrors && console.log(context?.problems);
            // }}
            {...handlers}
        >
            {children}
            {
                hovering &&
                <FlowNodeRowContextToolTip {...props} />
            }
        </ErrorUnderlineDiv>
    );
}

export default FlowNodeRowContextWrapper;
