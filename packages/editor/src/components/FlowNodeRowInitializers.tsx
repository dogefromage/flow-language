import * as lang from 'noodle-language';
import React from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../redux/stateHooks';
import { FlowNodeRowNameP } from '../styles/flowStyles';
import { formatFlowLabel } from '../utils/flows';
import FormCheckBox from './FormCheckBox';
import FormSlidableInput from './FormSlidableInput';
import FormTextInput from './FormTextInput';
import { RowComponentProps } from './FlowEditorContent';
import { flowsSetCallArgumentRowValue } from '../slices/flowsSlice';

// export const FlowNodeRowInitializers = (props: RowComponentProps<lang.InputRowSignature>) => {
//     const resType = lang.tryResolveTypeAlias(props.type, props.env);
//     if (resType?.type === 'function') {
//         return <FunctionInitializer {...props} />;
//     }
//     if (resType?.type === 'primitive') {
//         return <PrimitiveInitializer {...props} />;
//     }
//     console.warn(`Cannot find initializer for type '${resType}'.`);
//     return null;
// }

// const FunctionInitializer = (props: RowComponentProps<lang.ArgumentRowState>) => {
//     const dispatch = useAppDispatch();
//     const { panelId, type, env, flowId, nodeId, row, context } = props;

//     const { names, options } = useAvailableSignatureOptionsData(env);

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
//                         accessor: '0',
//                         rowId: row.id,
//                     }}
//                     env={env}
//                 />
//                 <FlowNodeRowNameP $align="left">{formatFlowLabel(row.id)}</FlowNodeRowNameP>
//                 <FormSelectOption
//                     value={context?.ref?.value || ''}
//                     options={options}
//                     mapName={names}
//                     onChange={newSignatureId => {
//                         dispatch(flowsSetRowValue({
//                             flowId, nodeId, rowId: row.id,
//                             rowValue: newSignatureId,
//                             undo: { desc: 'Updated function input value.' },
//                         }));
//                     }}
//                 />
//             </FlowNodeRowDiv>
//         </FlowNodeRowErrorWrapper >
//     );
// }

// const PrimitiveInitializer = (props: RowComponentProps<lang.ArgumentRowState>) => {
//     const { panelId, flowId, type, nodeId, env, row } = props;
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
//                         accessor: '0',
//                         rowId: row.id,
//                     }}
//                     env={env}
//                 />
//                 <PrimitiveInitializerSwitch {...props} />
//             </FlowNodeRowDiv>
//         </FlowNodeRowErrorWrapper>
//     );
// }

// const PrimitiveInitializerSwitch = (props: RowComponentProps<lang.InputRowSignature>) => {
//     const resType = lang.tryResolveTypeAlias(props.type, props.env);
//     if (resType?.type !== 'primitive') {
//         return null;
//     }
//     switch (resType.name) {
//         case 'number':
//             return <NumberInitializer {...props} />;
//         case 'boolean':
//             return <BooleanInitializer {...props} />;
//         case 'string':
//             return <StringInitializer {...props} />;
//     }
//     return null;
// }


export const ArgumentRowNumberInitializer = (props: RowComponentProps<lang.ArgumentRowState>) => {
    const dispatch = useAppDispatch();
    const { row, flowId, nodeId } = props;

    const value = props.row.value ?? 0;
    if (typeof value !== 'number') {
        console.error('typeof value must be number');
        return null;
    }

    return (
        <FormSlidableInput
            name={formatFlowLabel(row.id)}
            value={value}
            onChange={(newValue, actionToken) => {
                dispatch(flowsSetCallArgumentRowValue({
                    flowId, nodeId, rowId: row.id,
                    rowValue: newValue,
                    undo: { desc: 'Updated number.', actionToken },
                }))
            }}
        />
    )
}

const BooleanDiv = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`

export const ArgumentRowBooleanInitializer = (props: RowComponentProps<lang.ArgumentRowState>) => {
    const dispatch = useAppDispatch();
    const { row, flowId, nodeId } = props;

    const value = props.row.value ?? false;
    if (typeof value !== 'boolean') {
        console.error('typeof value must be number');
        return null;
    }

    return (
        <BooleanDiv>
            <FlowNodeRowNameP $align='left'>{formatFlowLabel(row.id)}</FlowNodeRowNameP>
            <FormCheckBox
                checked={value}
                setChecked={(newValue) => {
                    dispatch(flowsSetCallArgumentRowValue({
                        flowId, nodeId, rowId: row.id,
                        rowValue: newValue,
                        undo: { desc: 'Updated boolean.' },
                    }))
                }}
            />
        </BooleanDiv>
    );
}

export const ArgumentRowStringInitializer = (props: RowComponentProps<lang.ArgumentRowState>) => {
    const dispatch = useAppDispatch();
    const { row, flowId, nodeId } = props;

    const value = props.row.value ?? '';
    if (typeof value !== 'string') {
        console.error('typeof value must be number');
        return null;
    }

    return (
        <FormTextInput
            name={formatFlowLabel(row.id)}
            value={value}
            onChange={(newValue) => {
                dispatch(flowsSetCallArgumentRowValue({
                    flowId, nodeId, rowId: row.id,
                    rowValue: newValue,
                    undo: { desc: 'Updated string.' },
                }));
            }}
        />
    );
}
