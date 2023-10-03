import React, { PropsWithChildren } from 'react';
import { selectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectFlowContext } from '../slices/contextSlice';
import { flowsReplaceInput, flowsReplaceOutput, selectSingleFlow } from '../slices/flowsSlice';
import { ViewTypes } from '../types';
import { AllRowSignatures } from '../types/flowInspectorView';
import { flowRowTypeNames } from '../utils/flows';
import FormSelectOption from './FormSelectOption';
import TypeBuilder from './TypeBuilder';
import { FlowEnvironment, TypeSpecifier, createAnyType } from '@fluss/language';

type RowTypes = AllRowSignatures['rowType'];

const inputRowTypes: RowTypes[] = ['input-simple', 'input-variable'];
const outputRowTypes: RowTypes[] = ['output-simple', 'output-destructured'];

interface FlowInspectorPortDetailsProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorPortDetails = ({ panelId, flowId }: PropsWithChildren<FlowInspectorPortDetailsProps>) => {
    const dispatch = useAppDispatch();
    const flow = useAppSelector(selectSingleFlow(flowId));
    const flowContext = useAppSelector(selectFlowContext(flowId));
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowInspector, panelId));

    const notSelected = <p>Nothing selected.</p>;
    if (!flow) {
        return notSelected;
    }

    if (panelState?.selectedItem?.type === 'inputs') {
        const rowId = panelState.selectedItem?.id;
        const inputRow = flow?.inputs.find(input => input.id === rowId);
        if (!inputRow) {
            return notSelected;
        }
        return (
            <RowDetails
                rowTypes={inputRowTypes}
                row={inputRow}
                env={flowContext?.flowEnvironment}
                onReplace={newRowType => dispatch(flowsReplaceInput({
                    flowId,
                    rowId: inputRow.id,
                    blueprint: {
                        specifier: inputRow.specifier,
                        rowType: newRowType as RowTypes
                    },
                    undo: { desc: `Changed row type of input to '${flowRowTypeNames[newRowType]}'.` },
                }))}
                onChangeSpecifier={newSpecifier => {
                    dispatch(flowsReplaceInput({
                        flowId,
                        rowId: inputRow.id,
                        blueprint: {
                            specifier: newSpecifier,
                            rowType: inputRow.rowType
                        },
                        undo: { desc: 'Changed data type of input.' },
                    }));
                }}
            />
        )
    }

    if (panelState?.selectedItem?.type === 'output') {
        return (
            <RowDetails
                rowTypes={outputRowTypes}
                row={flow.output}
                env={flowContext?.flowEnvironment}
                onReplace={newRowType => dispatch(flowsReplaceOutput({
                    flowId,
                    blueprint: {
                        specifier: flow.output.specifier,
                        rowType: newRowType as RowTypes
                    },
                    undo: { desc: `Changed row type of output to '${flowRowTypeNames[newRowType]}'.` },
                }))}
                onChangeSpecifier={newSpecifier => {
                    dispatch(flowsReplaceOutput({
                        flowId,
                        blueprint: {
                            specifier: newSpecifier,
                            rowType: flow.output.rowType
                        },
                        undo: { desc: 'Changed data type of output.' },
                    }));
                }}
            />
        )
    }

    if (panelState?.selectedItem?.type === 'generics') {
        const genId = panelState.selectedItem?.id;
        const selectedTag = flow?.generics.find(g => g.id === genId);
        if (selectedTag == null) {
            return notSelected;
        }
        return (<>
            <p>Constraint</p>
            <TypeBuilder
                X={selectedTag.constraint || createAnyType()}
                env={flowContext?.flowEnvironment}
                onChange={() => {}}
            />
        </>)
    }

    return notSelected;
}

export default FlowInspectorPortDetails;


interface RowDetailsProps {
    row: AllRowSignatures;
    env: FlowEnvironment | undefined;
    rowTypes: RowTypes[];
    onReplace: (newRowType: RowTypes) => void;
    onChangeSpecifier: (X: TypeSpecifier) => void;
}
export const RowDetails = ({ row, env, rowTypes, onReplace, onChangeSpecifier }: PropsWithChildren<RowDetailsProps>) => {

    return (<>
        <p>Row Type</p>
        <FormSelectOption
            value={row.rowType}
            onChange={newRowType => onReplace(newRowType as RowTypes)}
            options={rowTypes}
            mapName={flowRowTypeNames}
        />
        <p>Data Type</p>
        <TypeBuilder
            X={row.specifier}
            env={env}
            onChange={onChangeSpecifier}
        />
    </>);
}