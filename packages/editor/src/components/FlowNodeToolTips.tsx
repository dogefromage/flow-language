import * as lang from 'noodle-language';
import React, { PropsWithChildren } from 'react';
import { Bold } from '../styles/typography';
import ToolTip from './ToolTip';
import { useTypeToString } from '../utils/flows';

const colors = {
    title: '#ffcc5e',
    specifier: '#5effe7',
    type: '#5effe7',
    alias: '#b7ff00',
    problem: '#ff3463',
    typeProblemMessage: '#ff3463',
}

// export const FlowNodeRowContextToolTipContent = (props: RowComponentProps) => {
//     const { context, type, row, env } = props;
//     return (
//         <>
//             <ToolTip.SectionDiv>
//                 <p>
//                     Row Type:&nbsp;
//                     <Bold $color={colors.title}>
//                         {flowRowTypeNames[row.rowType]}
//                     </Bold>
//                 </p>
//                 <p>
//                     Data Type:&nbsp;
//                     <Bold $color={colors.specifier}>
//                         {formatSpecifier(type, env)}
//                     </Bold>
//                 </p>
//             </ToolTip.SectionDiv> {
//                 context?.value != null &&
//                 <ToolTip.SectionDiv>
//                     <p>
//                         Row value:&nbsp;
//                         <Bold $color={colors.type}>
//                             {formatValue(context.value)}
//                         </Bold>
//                     </p>
//                 </ToolTip.SectionDiv>
//             }
//             {
//                 context?.problems.map((problem, index) =>
//                     <FlowNodeRowProblemMessage
//                         key={`${problem.type}:${index}`}
//                         problem={problem}
//                     />
//                 )
//             }
//         </>
//     );
// }

interface ProblemProps {
    problem: lang.ValidationProblem;
}

export const FlowNodeRowProblemMessage = ({ problem }: PropsWithChildren<ProblemProps>) => {
    return (<>
        <ToolTip.SectionDiv>
            <p>
                <Bold $color={colors.problem}>
                    {problem.message}
                </Bold>
            </p>
        </ToolTip.SectionDiv>
        {/* <TypeProblemLocation problem={problem} /> */}
    </>);
}

// const PreP = styled.p`
//     font-weight: bold;
//     white-space: pre;
// `;
// const Col = styled.span<{ $color?: string }>`
//     ${({ $color }) => $color && `color: ${$color};`}
// `;

// const TypeProblemLocation = ({ problem }: PropsWithChildren<ProblemProps>) => {
//     if (problem.type !== 'incompatible-argument-type' &&
//         problem.type !== 'invalid-value'
//     ) return null;

//     if (problem.typeProblem == null) return null;

//     const lines: React.ReactNode[] = [];
//     let indent = '';
//     for (const node of problem.typeProblem.path.nodes) {
//         if (node.formatting === 'property') {
//             if (lines.length) {
//                 const isNum = isFinite(parseInt(node.key));
//                 let accessor = isNum ? `[${node.key}]` : `.${node.key}`
//                 lines.push(accessor);
//             }
//         } else {
//             if (lines.length) {
//                 lines.push(<br />)
//             }
//             lines.push(
//                 <Col $color={colors[node.formatting]}>{indent + node.key}</Col>
//             );
//             indent += '  ';
//         }
//     }
//     if (lines.length) {
//         lines.push(<br />)
//     }
//     lines.push(
//         <Col $color={colors.typeProblemMessage}>{indent + problem.typeProblem.message}</Col>
//     );

//     return (<>
//         <ToolTip.SectionDiv>
//             <PreP>
//                 Type Problem Location:<br />
//                 {lines.map((line, index) =>
//                     <Fragment key={index}>{line}</Fragment>
//                 )}
//             </PreP>
//         </ToolTip.SectionDiv>
//     </>);
// }

interface FlowNodeHeaderToolTipProps {
    flowId: string;
    node: lang.CallNode;
    context: lang.CallNodeContext;
}
export const FlowNodeHeaderToolTipContent = ({ flowId, node, context }: FlowNodeHeaderToolTipProps) => {
    const signatureType = useTypeToString(flowId, context.signature?.type);
    const outputType = useTypeToString(flowId, context.outputType);

    return (
        <>
            <ToolTip.SectionDiv>
                <p>
                    Application Node&nbsp;
                    <Bold $color={colors.specifier}>#{node.id}</Bold>
                </p>
                <p>
                    Function Path:&nbsp;<Bold $color={colors.title}>{node.functionId}</Bold> <br/>
                    Function Type:&nbsp;<Bold $color={colors.specifier}>{signatureType}</Bold> <br/>
                </p>
                <p>
                    Returned Type:&nbsp;<Bold $color={colors.alias}>{outputType}</Bold> <br/>
                </p>
            </ToolTip.SectionDiv> {
                context.signature?.attributes.description &&
                <ToolTip.SectionDiv>
                    <p>{ context.signature?.attributes.description }</p>
                </ToolTip.SectionDiv>
            } {
                context.problems.map((problem, index) => (
                    <FlowNodeRowProblemMessage
                        key={`${problem.message}:${index}`}
                        problem={problem}
                    />
                ))
            }
        </>
    );
}
