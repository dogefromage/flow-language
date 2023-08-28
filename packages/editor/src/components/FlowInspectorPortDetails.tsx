import React, { PropsWithChildren } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectFlowContext } from '../slices/contextSlice';
import { flowsReplacePort, selectSingleFlow } from '../slices/flowsSlice';
import { AllRowSignatures, FlowPortLists } from '../types/flowInspectorView';
import FormSelectOption from './FormSelectOption';
import TypeBuilder from './TypeBuilder';
import { flowRowTypeNames } from '../utils/flows';

type RowTypes = AllRowSignatures['rowType'];

const rowTypesOfDirection: Record<FlowPortLists, RowTypes[]> = {
    inputs:  ['input-list', 'input-simple', 'input-variable', 'input-function' ],
    outputs: ['output-simple', 'output-destructured' ],
};

interface FlowInspectorPortDetailsProps {
    panelId: string;
    flowId: string;
    portType: FlowPortLists;
    portId: string;
}

const FlowInspectorPortDetails = ({ panelId, flowId, portType, portId }: PropsWithChildren<FlowInspectorPortDetailsProps>) => {
    const dispatch = useAppDispatch();
    const flow = useAppSelector(selectSingleFlow(flowId));
    const flowContext = useAppSelector(selectFlowContext(flowId));

    const rowTypes = rowTypesOfDirection[portType];

    const ports: AllRowSignatures[] | undefined = flow?.[portType];
    const row = ports?.find(p => p.id === portId);
    if (row == null) {
        return null;
    }

    return (<>
        <p>Row Type</p>
        <FormSelectOption 
            value={row.rowType}
            onChange={newRowType => {
                dispatch(flowsReplacePort({
                    flowId,
                    portType,
                    portId,
                    blueprint: { 
                        specifier: row.specifier, 
                        rowType: newRowType as RowTypes 
                    },
                    undo: { desc: 'TODO' },
                }));
            }}
            options={rowTypes}
            mapName={flowRowTypeNames}
        />
        <p>Data Type</p>
        <TypeBuilder
            X={row.specifier}
            env={flowContext?.flowEnvironment}
            onChange={newSpecifier => {
                dispatch(flowsReplacePort({
                    flowId,
                    portType,
                    portId,
                    blueprint: { 
                        specifier: newSpecifier, 
                        rowType: row.rowType as RowTypes 
                    },
                    undo: { desc: 'TODO' },
                }));
            }}
        />
    </>);
}

export default FlowInspectorPortDetails;