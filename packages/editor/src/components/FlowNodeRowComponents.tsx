
// export const FlowOutputRowSwitch = (props: RowComponentProps<lang.OutputSignature>) => {
//     switch (props.row.) {
//         case 'initializer':
//         case 'hidden':
//             return null;
//         case 'destructured':
//             return <FlowOutputRowDestructurings {...props as RowComponentProps<lang.OutputRowSignature>} />
//         case 'simple':
//             return <FlowOutputRowSimple {...props as RowComponentProps<lang.OutputRowSignature>} />
//     }
//     console.error(`Unknown display type '${props.context?.display}.`);
//     return null;
// }

// export const FlowInputRowSwitch = (props: RowComponentProps<lang.InputRowSignature>) => {
//     switch (props.context?.display) {
//         case 'simple':
//             return <FlowInputRowSimple {...props} />
//         case 'initializer':
//             return <FlowNodeRowInitializers {...props} />
//         case 'destructured':
//             return <FlowInputRowDestructurings {...props} />
//         case 'hidden':
//             return null;
//     }
//     console.error(`Unknown display type '${props.context?.display}.`);
//     return null;
// }

// export const FlowInputRowSimple = (props: RowComponentProps<lang.InputRowSignature>) => {
//     const { panelId, flowId, nodeId, row, context, type, env } = props;

//     return (
//         <FlowNodeRowErrorWrapper {...props}>
//             <FlowNodeRowDiv>
//                 <FlowJoint
//                     panelId={panelId}
//                     flowId={flowId}
//                     type={type}
//                     location={{
//                         direction: 'input',
//                         nodeId,
//                         rowId: row.id,
//                         accessor: '0',
//                     }}
//                     env={env}
//                 />
//                 <FlowNodeRowNameP $align='left'>
//                     {formatFlowLabel(row.id)}
//                 </FlowNodeRowNameP>
//             </FlowNodeRowDiv>
//         </FlowNodeRowErrorWrapper>
//     );
// }
