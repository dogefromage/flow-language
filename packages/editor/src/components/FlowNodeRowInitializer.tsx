import * as lang from '@fluss/language';
import React from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../redux/stateHooks';
import { flowsSetRowValue } from '../slices/flowsSlice';
import { FlowNodeRowNameP } from '../styles/flowStyles';
import FormCheckBox from './FormCheckBox';
import FormSlideableInput from './FormSlideableInput';
import FormTextInput from './FormTextInput';

interface Props {
    flowId: string;
    nodeId: string;
    row: lang.VariableInputRowSignature;
    context: lang.RowContext | undefined;
    type: lang.TypeSpecifier | undefined;
}

const FlowNodeRowInitializer = ({ flowId, nodeId, row, context, type }: Props) => {
    // display value should be set if nothing is connected
    if (context && context.displayValue != null) {
        if (typeof type === 'object' && type.type === 'primitive') {
            const props: InitializerProps = {
                flowId, nodeId, rowId: row.id,
                name: row.label,
                value: context.displayValue,
            }
            switch (type.name) {
                case 'number':
                    return <NumberInitializer {...props} />;
                case 'boolean':
                    return <BooleanInitializer {...props} />;
                case 'string':
                    return <StringInitializer {...props} />;
            }
        }
    }

    return (
        <NameRow label={row.label} />
    );
}

export default FlowNodeRowInitializer;

const NameRow = ({ label }: { label: string }) => (
    <FlowNodeRowNameP $align='left'>{label}</FlowNodeRowNameP>
);

type InitializerProps = {
    flowId: string;
    nodeId: string;
    rowId: string;
    name: string;
    value: lang.InitializerValue;
}

const NumberInitializer = ({ flowId, nodeId, rowId, name, value }: InitializerProps) => {
    const dispatch = useAppDispatch();

    if (typeof value !== 'number') {
        console.error('typeof value must be number');
        return null;
    }

    return (
        <FormSlideableInput
            name={name}
            value={value}
            onChange={(newValue, actionToken) => {
                dispatch(flowsSetRowValue({
                    flowId, nodeId, rowId,
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

const BooleanInitializer = ({ flowId, nodeId, rowId, name, value }: InitializerProps) => {
    const dispatch = useAppDispatch();

    if (typeof value !== 'boolean') {
        console.error('typeof value must be number');
        return null;
    }

    return (
        <BooleanDiv>
            <FlowNodeRowNameP $align='left'>{name}</FlowNodeRowNameP>
            <FormCheckBox
                checked={value}
                setChecked={(newValue) => {
                    dispatch(flowsSetRowValue({
                        flowId, nodeId, rowId,
                        rowValue: newValue,
                        undo: { desc: 'Updated boolean.' },
                    }))
                }}
            />
        </BooleanDiv>
    );
}

const StringInitializer = ({ flowId, nodeId, rowId, name, value }: InitializerProps) => {
    const dispatch = useAppDispatch();

    if (typeof value !== 'string') {
        console.error('typeof value must be number');
        return null;
    }

    return (
        <FormTextInput
            name={name}
            value={value}
            onChange={(newValue) => {
                dispatch(flowsSetRowValue({
                    flowId, nodeId, rowId,
                    rowValue: newValue,
                    undo: { desc: 'Updated string.' },
                }));
            }}
        />
    );
}