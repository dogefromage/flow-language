import * as lang from '@fluss/language';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../redux/stateHooks';
import { flowsSetRowValue } from '../slices/flowsSlice';
import { FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';
import { formatFlowLabel } from '../utils/flows';
import { RowComponentProps } from './FlowNodeRowComponents';
import FormCheckBox from './FormCheckBox';
import FormSelectOption from './FormSelectOption';
import FormSlideableInput from './FormSlideableInput';
import FormTextInput from './FormTextInput';
import FlowJoint from './FlowJoint';
import { FlowNodeRowErrorWrapper } from './FlowNodeErrorWrapper';

export const FlowNodeRowInitializers = (props: RowComponentProps<lang.InputRowSignature>) => {
    const resType = lang.tryResolveTypeAlias(props.type, props.env);
    if (resType?.type === 'function') {
        return <FunctionInitializer {...props} />;
    }
    if (resType?.type === 'primitive') {
        return <PrimitiveInitializer {...props} />;
    }
    console.warn(`Cannot find initializer for type '${resType}'.`);
    return null;
}

const FunctionInitializer = (props: RowComponentProps<lang.InputRowSignature>) => {
    const dispatch = useAppDispatch();
    const { panelId, type, env, flowId, nodeId, row, context } = props;

    const signatures = useMemo(() => {
        const envContent = lang.collectTotalEnvironmentContent(env);
        return Object
            .entries(envContent.signatures || {})
            .map(([_, signature]) => signature.id);
    }, [env]);

    return (
        <FlowNodeRowErrorWrapper {...props}>
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'input',
                        nodeId,
                        accessor: '0',
                        rowId: row.id,
                        initializer: 'function',
                    }}
                    env={env}
                />
                <FlowNodeRowNameP $align="left">{formatFlowLabel(row.id)}</FlowNodeRowNameP>
                <FormSelectOption
                    value={context?.ref?.value || ''}
                    options={signatures}
                    onChange={newSignatureId => {
                        dispatch(flowsSetRowValue({
                            flowId, nodeId, rowId: row.id,
                            rowValue: newSignatureId,
                            undo: { desc: 'Updated function input value.' },
                        }));
                    }}
                />
            </FlowNodeRowDiv>
        </FlowNodeRowErrorWrapper >
    );
}

const PrimitiveInitializer = (props: RowComponentProps<lang.InputRowSignature>) => {
    const { panelId, flowId, type, nodeId, env, row } = props;
    return (
        <FlowNodeRowErrorWrapper {...props}>
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'input',
                        nodeId,
                        accessor: '0',
                        rowId: row.id,
                        initializer: 'first',
                    }}
                    env={env}
                />
                <PrimitiveInitializerSwitch {...props} />
            </FlowNodeRowDiv>
        </FlowNodeRowErrorWrapper>
    );
}

const PrimitiveInitializerSwitch = (props: RowComponentProps<lang.InputRowSignature>) => {
    const resType = lang.tryResolveTypeAlias(props.type, props.env);
    if (resType?.type !== 'primitive') {
        return null;
    }
    switch (resType.name) {
        case 'number':
            return <NumberInitializer {...props} />;
        case 'boolean':
            return <BooleanInitializer {...props} />;
        case 'string':
            return <StringInitializer {...props} />;
    }
    return null;
}


const NumberInitializer = (props: RowComponentProps<lang.InputRowSignature>) => {
    const dispatch = useAppDispatch();
    const { row, flowId, nodeId } = props;

    const value = props.context?.value ?? 0;
    if (typeof value !== 'number') {
        console.error('typeof value must be number');
        return null;
    }

    return (
        <FormSlideableInput
            name={formatFlowLabel(row.id)}
            value={value}
            onChange={(newValue, actionToken) => {
                dispatch(flowsSetRowValue({
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

const BooleanInitializer = (props: RowComponentProps<lang.InputRowSignature>) => {
    const dispatch = useAppDispatch();
    const { row, flowId, nodeId } = props;

    const value = props.context?.value ?? false;
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
                    dispatch(flowsSetRowValue({
                        flowId, nodeId, rowId: row.id,
                        rowValue: newValue,
                        undo: { desc: 'Updated boolean.' },
                    }))
                }}
            />
        </BooleanDiv>
    );
}

const StringInitializer = (props: RowComponentProps<lang.InputRowSignature>) => {
    const dispatch = useAppDispatch();
    const { row, flowId, nodeId } = props;

    const value = props.context?.value ?? '';
    if (typeof value !== 'string') {
        console.error('typeof value must be number');
        return null;
    }

    return (
        <FormTextInput
            name={formatFlowLabel(row.id)}
            value={value}
            onChange={(newValue) => {
                dispatch(flowsSetRowValue({
                    flowId, nodeId, rowId: row.id,
                    rowValue: newValue,
                    undo: { desc: 'Updated string.' },
                }));
            }}
        />
    );
}
