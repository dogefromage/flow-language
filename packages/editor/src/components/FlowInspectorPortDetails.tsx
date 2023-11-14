import * as lang from 'noodle-language';
import { PropsWithChildren } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectFlowContext } from '../slices/contextSlice';
import {
    flowsReplaceGeneric,
    flowsReplaceInput,
    flowsReplaceOutput,
    useSelectSingleFlow
} from '../slices/flowsSlice';
import { useSelectFlowInspectorPanel } from '../slices/panelFlowInspectorSlice';
import { AllRowSignatures } from '../types';
import { flowRowTypeNames } from '../utils/flows';
import FormSelectOption from './FormSelectOption';
import TypeBuilder from './TypeBuilder';

type RowTypes = AllRowSignatures['rowType'];

const inputRowTypes: RowTypes[] = ['input-simple', 'input-variable'];
const outputRowTypes: RowTypes[] = ['output-simple', 'output-destructured'];

interface FlowInspectorPortDetailsProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorPortDetails = ({ panelId, flowId }: PropsWithChildren<FlowInspectorPortDetailsProps>) => {
    const dispatch = useAppDispatch();
    const flow = useAppSelector(useSelectSingleFlow(flowId));
    const flowContext = useAppSelector(selectFlowContext(flowId));
    const panelState = useAppSelector(useSelectFlowInspectorPanel(panelId));

    const notSelected = <p>No Port selected.</p>;
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
                generics={flowContext?.flowSignature.generics || []}
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
                generics={flowContext?.flowSignature.generics || []}
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
                X={selectedTag.constraint || lang.createAnyType()}
                env={flowContext?.flowEnvironment}
                // atm cannot use generics for other generic constraints / maybe implement
                generics={[]} 
                onChange={newType => {
                    dispatch(flowsReplaceGeneric({
                        flowId,
                        genericId: genId,
                        constraint: newType,
                        undo: { desc: `Replaced constraint on generic parameter '${genId}'.` },
                    }));
                }}
            />
        </>)
    }

    return notSelected;
}

export default FlowInspectorPortDetails;


interface RowDetailsProps {
    row: AllRowSignatures;
    env: lang.FlowEnvironment | undefined;
    generics: lang.TemplateParameter[];
    rowTypes: RowTypes[];
    onReplace: (newRowType: RowTypes) => void;
    onChangeSpecifier: (X: lang.TypeSpecifier) => void;
}
export const RowDetails = ({ row, env, generics, rowTypes, onReplace, onChangeSpecifier }: PropsWithChildren<RowDetailsProps>) => {

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
            generics={generics}
        />
    </>);
}