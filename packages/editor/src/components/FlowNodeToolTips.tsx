import * as lang from '@noodles/language';
import React, { Fragment, PropsWithChildren } from 'react';
import styled from 'styled-components';
import { Bold } from '../styles/common';
import { flowRowTypeNames } from '../utils/flows';
import { formatSpecifier, formatSpecifierWithGenerics } from '../utils/typeFormatting';
import { RowComponentProps } from './FlowNodeRowComponents';

const ToolTipWrapperDiv = styled.div`
    position: absolute;
    z-index: 100;

    width: max-content;
    
    left: 0;
    bottom: calc(100% + 0.5rem);
    padding: 0.25rem 0.5rem;

    background-color: var(--color-3);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);

    max-width: 600px;

    p {
        word-wrap: break-word;
    }

    h1 {
        margin: 0;
        padding: 0;
    }
`;

const ToolTipSection = styled.div`
    :not(:first-child) {
        border-top: 1px solid var(--color-1);
    }
    padding: 0.25rem 0;
`;


const colors = {
    title:              '#ffcc5e',
    specifier:          '#5effe7',
    type:               '#5effe7',
    alias:              '#b7ff00',
    problem:            '#ff3463',
    typeProblemMessage: '#ff3463',
}

export const FlowNodeRowContextToolTip = (props: RowComponentProps) => {
    const { context, type, row, env } = props;
    return (
        <ToolTipWrapperDiv>
            <ToolTipSection>
                <p>
                    Row Type:&nbsp;
                    <Bold $color={colors.title}>
                        {flowRowTypeNames[row.rowType]}
                    </Bold>
                </p>
                <p>
                    Data Type:&nbsp;
                    <Bold $color={colors.specifier}>
                        {formatSpecifier(type, env)}
                    </Bold>
                </p>
            </ToolTipSection>
            {
                context?.problems.map((problem, index) =>
                    <FlowNodeRowProblemMessage
                        key={`${problem.type}:${index}`}
                        problem={problem}
                    />
                )
            }
        </ToolTipWrapperDiv>
    );
}

interface ProblemProps {
    problem: lang.RowProblem;
}

const FlowNodeRowProblemMessage = ({ problem }: PropsWithChildren<ProblemProps>) => {
    return (<>
        <ToolTipSection>
            <p>
                <Bold $color={colors.problem}>
                    {problem.message}
                </Bold>
            </p>
        </ToolTipSection>
        <TypeProblemLocation problem={problem} />
    </>);
}

const PreP = styled.p`
    font-weight: bold;
    white-space: pre;
`;
const Col = styled.span<{ $color?: string }>`
    ${({ $color }) => $color && `color: ${$color};`}
`;

const TypeProblemLocation = ({ problem }: PropsWithChildren<ProblemProps>) => {
    if (problem.type !== 'incompatible-argument-type' &&
        problem.type !== 'invalid-value'
    ) return null;

    if (problem.typeProblem == null) return null;
    
    const lines: React.ReactNode[] = [];
    let indent = '';
    for (const node of problem.typeProblem.path.nodes) {
        if (node.formatting === 'property') {
            if (lines.length) {
                const isNum = isFinite(parseInt(node.key));
                let accessor = isNum ? `[${node.key}]` : `.${node.key}`
                lines.push(accessor);
            }
        } else {
            if (lines.length) {
                lines.push(<br/>)
            }
            lines.push(
                <Col $color={colors[node.formatting]}>{ indent + node.key }</Col>
            );
            indent += '  ';
        }
    }
    if (lines.length) {
        lines.push(<br/>)
    }
    lines.push(
        <Col $color={colors.typeProblemMessage}>{ indent + problem.typeProblem.message }</Col>
    );

    return (<>
        <ToolTipSection>
            <PreP>
                Type Problem Location:<br />
                {lines.map((line, index) =>
                    <Fragment key={index}>{ line }</Fragment>
                )}
            </PreP>
        </ToolTipSection>
    </>);
}

interface FlowNodeHeaderToolTipProps {
    signature: lang.FlowSignature;
    context: lang.FlowNodeContext;
    env: lang.FlowEnvironment;
}
export const FlowNodeHeaderToolTip = ({ signature, context, env }: FlowNodeHeaderToolTipProps) => {
    return (
        <ToolTipWrapperDiv>
            <ToolTipSection>
                <p>
                    Node:&nbsp;
                    <Bold $color={colors.title}>
                        #{context.ref.id}
                    </Bold>
                </p>
                <p>
                    Type Signature:&nbsp;
                    <Bold $color={colors.specifier}>
                        {formatSpecifierWithGenerics(
                            lang.getTemplatedSignatureType(signature), 
                            env, 
                        )}
                    </Bold>
                </p>
                <p>
                    Infered Type:&nbsp;
                    <Bold $color={colors.alias}>
                        {formatSpecifierWithGenerics(
                            context.inferredType || { generics: [], specifier: lang.createAnyType() },
                            env,
                        )}
                    </Bold>
                </p>
            </ToolTipSection>
            {
                signature.description &&
                <p>{ signature.description }</p>
            }
        </ToolTipWrapperDiv>
    );
}
