import React from 'react';
import styled from 'styled-components';
import { FLOW_NODE_ROW_HEIGHT } from '../styles/flowStyles';
import { RowComponentProps } from './FlowNodeRowComponents';
import formatSpecifier from '../utils/formatSpecifier';
import { Bold } from '../styles/common';
import FlowNodeRowProblemMessage from './FlowNodeRowProblemMessage';

const ToolTipWrapperDiv = styled.div`
    position: absolute;

    p {
        white-space: nowrap;
    }
    
    left: 0;
    bottom: calc(100% + 0.5rem);
    padding: 0.5rem;

    background-color: var(--color-3);
    border-radius: var(--border-radius);

    h1 {
        margin: 0;
        padding: 0;
    }
`;

const FlowNodeRowContextToolTip = (props: RowComponentProps) => {
    const { context, type, row, env } = props;

    return (
        <ToolTipWrapperDiv>
            <p>
                Row Type:&nbsp;
                <Bold $color='#ffcc5e'>
                    {row.rowType}
                </Bold>
            </p>
            <p>
                Data Type:&nbsp;
                <Bold $color='#5effe7'>
                    {formatSpecifier(type, env)}
                </Bold>
            </p>
            {
                context?.problems.map(problem => 
                    <FlowNodeRowProblemMessage problem={problem} />
                )
            }
        </ToolTipWrapperDiv>
    );
}

export default FlowNodeRowContextToolTip;