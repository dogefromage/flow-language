import { PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import { RowComponentProps } from './FlowNodeRowComponents';
import { FlowNodeRowContextToolTipContent } from './FlowNodeToolTips';
import { ToolTipAnchor, ToolTipContentComponent } from './ToolTip';

const ErrorUnderlineDiv = styled.div<{ $hasErrors: boolean, $debugBackColor?: string }>`
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
}

export const FlowNodeErrorWrapper = ({ children, hasErrors }: PropsWithChildren<FlowNodeErrorWrapperProps>) => {
    return (
        <ErrorUnderlineDiv $hasErrors={hasErrors}>
            {children}
        </ErrorUnderlineDiv>
    );
}

export const FlowNodeRowErrorWrapper = (props: PropsWithChildren<RowComponentProps>) => {
    const { children, context } = props;

    const RowTooltip: ToolTipContentComponent = () => (
        <FlowNodeRowContextToolTipContent {...props} />
    );

    return (
        <ToolTipAnchor tooltip={RowTooltip}>
            <FlowNodeErrorWrapper hasErrors={!!context?.problems.length}>
                {children}
            </FlowNodeErrorWrapper>
        </ToolTipAnchor>
    );
}
