// import * as lang from 'noodle-language';
// import { FlowNodeNameWrapper, FlowNodeRowNameP } from '../styles/flowStyles';
// import { formatFlowLabel } from '../utils/flows';
// import { FlowNodeErrorWrapper } from './FlowNodeErrorWrapper';
// import { FlowInputRowSwitch, FlowOutputRowSwitch } from './FlowNodeRowComponents';
// import { FlowNodeHeaderToolTipContent } from './FlowNodeToolTips';
// import ToolTip from './ToolTip';
// import React, { PropsWithChildren, useRef, useState } from 'react';
// import styled from 'styled-components';
// import { useAppDispatch } from '../redux/stateHooks';
// import { flowsSetRegionAttribute } from '../slices/flowsSlice';
// import { v4 } from 'uuid';

// interface Props {
//     panelId: string;
//     flowId: string;
//     context: lang.FlowNodeContext;
//     signature: lang.FlowSignature;
//     env: lang.FlowEnvironment;
// }

// const { panelId, flowId, context, signature, env } = props;
// const FlowNodeContent = (props: Props) => {
//     const commonProps = { panelId, flowId, nodeId: context.ref.id };

//     let inputType: lang.TupleTypeSpecifier | undefined;
//     if (typeof context.inferredType?.specifier.parameter !== 'string' && 
//         context.inferredType?.specifier.parameter.type === 'tuple') {
//         inputType = context.inferredType.specifier.parameter;
//     }
//     const outputType = context.inferredType?.specifier.output;

//     const HeaderToolTip = () => (
//         <FlowNodeHeaderToolTipContent
//             env={env} 
//             context={context} 
//             signature={signature} 
//         />
//     );

//     return (<>
//         <ToolTip.Anchor tooltip={HeaderToolTip}>
//             <FlowNodeNameWrapper $backColor={signature.attributes.color}>
//                 <FlowNodeErrorWrapper hasErrors={!!context.problems.length}>
//                     <FlowNodeRowNameP $align='left' $bold={true}>
//                         {formatFlowLabel(signature.id)}
//                     </FlowNodeRowNameP>
//                 </FlowNodeErrorWrapper>
//             </FlowNodeNameWrapper>
//         </ToolTip.Anchor>
//         <FlowOutputRowSwitch
//             {...commonProps}
//             key={signature.output.id}
//             row={signature.output}
//             type={outputType || lang.createAnyType()}
//             context={context.outputRow}
//             env={env}
//         />
//         {
//             signature.inputs.map((input, index) =>
//                 <FlowInputRowSwitch
//                     {...commonProps}
//                     key={input.id}
//                     row={input}
//                     type={inputType?.elements[index] || lang.createAnyType()}
//                     context={context.inputRows[input.id]}
//                     env={env}
//                 />
//             )
//         }
//     </>);
// }

// export default FlowNodeContent;
