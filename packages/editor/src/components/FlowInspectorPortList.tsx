import * as lang from '@fluss/language';
import React, { PropsWithChildren, useMemo, useState } from "react";
import { ItemInterface } from 'react-sortablejs';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { selectFlowContext } from '../slices/contextSlice';
import { flowsAddPort, flowsRemovePort, flowsReorderPorts, flowsReplacePort, flowsUpdatePort } from '../slices/flowsSlice';
import MaterialSymbol from '../styles/MaterialSymbol';
import { FormSettingsGridDiv } from '../styles/formStyles';
import { RowSignatureBlueprint } from '../types/flowRows';
import FormRenameField from './FormRenameField';
import FormSelectOption from './FormSelectOption';
import { FormSortableList, FormSortableListHandle, FormSortableListItemDiv } from "./FormSortableList";

type RowSignature = lang.InputRowSignature | lang.OutputRowSignature;
type Direction = 'in' | 'out';

const fullDirectionName: Record<Direction, string> = {
    'in': 'input',
    'out': 'output',
};
const rowTypesOfDirection: Record<Direction, RowSignature['rowType'][]> = {
    'in': ['input-list', 'input-simple', 'input-variable'],
    'out': ['output'],
};
const rowTypesNames: Record<RowSignature['rowType'], string> = {
    'input-simple': 'Simple Input',
    'input-variable': 'Variable Input',
    'input-list': 'List Input',
    'output': 'Output',
}

function getBlueprintKey(bp: RowSignatureBlueprint): string {
    if (typeof bp.specifier === 'string') {
        return `${bp.rowType}:${bp.specifier}`;
    } else if (bp.specifier.type === 'list') {
        return `${bp.rowType}:${bp.specifier.type}:${bp.specifier.element}`;
    }
    console.error(`Unknown blueprint`);
    return '';
}

function generateBlueprints(direction: Direction, env?: lang.FlowEnvironment) {
    let specifierNames: string[] = [];
    if (env != null) {
        const content = lang.collectTotalEnvironmentContent(env)
        specifierNames = Object.keys(content.types || {});
    }

    const blueprints: Record<string, RowSignatureBlueprint> = {};
    const blueprintOptions: string[] = [];
    const blueprintNames: Record<string, string> = {};

    for (const specifierName of specifierNames) {
        for (const rowType of rowTypesOfDirection[direction]) {
            let specifier: lang.TypeSpecifier = specifierName;
            if (rowType === 'input-list') {
                specifier = lang.createListType(specifierName);
            }
            const blueprint = { rowType, specifier };
            const key = getBlueprintKey(blueprint);
            blueprintOptions.push(key);
            blueprints[key] = blueprint;
            blueprintNames[key] = `${specifierName} - ${rowTypesNames[rowType]}`;
        }
    }
    return {
        blueprints,
        blueprintOptions,
        blueprintNames,
    }
}



interface PortDivProps {
    $selected?: boolean;
}

const PortDiv = styled.div<PortDivProps>`
    width: 100%;
    padding: 0 0.5rem;

    height: fit-content;
    max-height: var(--list-height);
    transition: max-height 250ms cubic-bezier(.4,.01,.59,1.11);
    
    overflow: hidden;
    ${({ $selected }) => $selected && 'max-height: 150px;'}
    
    display: flex;
    flex-direction: column;
    gap: var(--list-gap);

    .header {
        cursor: pointer;

        height: var(--list-height);
        flex-shrink: 0;

        display: flex;
        justify-content: space-between;
        align-items: center;

        .left, .right {
            display: flex;
            justify-content: space-around;
            align-items: center;
            gap: 0.25rem;
        }
    }

    .details {
        border-top: solid 1px #00000077;
    }
`;



interface FlowInspectorPortListProps {
    flowId: string;
    locked: boolean;
    ports: RowSignature[];
    direction: Direction;
}

const FlowInspectorPortList = ({ ports, flowId, locked, direction }: PropsWithChildren<FlowInspectorPortListProps>) => {
    const dispatch = useAppDispatch();
    const [selectedId, setSelectedId] = useState('');
    const flowContext = useAppSelector(selectFlowContext(flowId));
    const env = flowContext?.flowEnvironment;

    const {
        blueprints,
        blueprintOptions,
        blueprintNames,
    } = useMemo(() => generateBlueprints(direction, env), [direction, env]);

    const addPort = (blueprintKey: string) => {
        if (locked) return;
        const blueprint = blueprints[blueprintKey];
        if (!blueprint) return;
        dispatch(flowsAddPort({
            flowId,
            direction,
            blueprint,
            undo: { desc: `Added ${fullDirectionName[direction]} port to active flow.` },
        }))
    }

    const removePort = (portId: string) => {
        if (locked) return;
        dispatch(flowsRemovePort({
            flowId,
            direction,
            portId,
            undo: { desc: `Removed ${fullDirectionName[direction]} port "${portId}" from active flow.` },
        }))
    }

    const reorderPorts = (newState: ItemInterface[]) => {
        if (locked) return;
        const newOrder = newState.map(row => row.id) as string[];
        dispatch(flowsReorderPorts({
            flowId,
            direction,
            newOrder,
            undo: { desc: `Reordered ${fullDirectionName[direction]} ports of active flow.` },
        }));
    }

    const replacePort = (portId: string, blueprintKey: string) => {
        if (locked) return;
        const blueprint = blueprints[blueprintKey];
        if (!blueprint) return;
        dispatch(flowsReplacePort({
            flowId,
            portId,
            direction,
            blueprint,
            undo: { desc: `Replaced ${fullDirectionName[direction]} port.` },
        }));
    }

    const updatePortLabel = (portId: string, label: string) => {
        if (locked) return;
        dispatch(flowsUpdatePort({
            flowId,
            portId,
            direction,
            newState: { label },
            undo: { desc: `Renamed ${fullDirectionName[direction]} port to '${label}'.` },
        }));
    }

    const addPortNode = (
        !locked &&
        <FormSelectOption
            className='add-dropdown'
            onChange={addPort}
            options={blueprintOptions}
            mapName={blueprintNames}
            icon='add'
            value={`Add ${fullDirectionName[direction]} Port`}
        />
    )

    return (
        <FormSortableList
            order={ports}
            onUpdateOrder={reorderPorts}
            addPortNode={addPortNode}
        >
            {ports.map((port, index) =>
                <FormSortableListItemDiv
                    key={port.id}
                    $disabled={locked}
                    $selected={!locked && port.id === selectedId}
                    onClick={() => setSelectedId(port.id)}
                >
                    <PortDiv
                        $selected={!locked && port.id === selectedId}
                    >
                        <div className='header'>
                            <div className='left'>
                                <FormSortableListHandle disabled={locked} />
                                <FormRenameField
                                    value={port.label}
                                    onChange={newValue => updatePortLabel(port.id, newValue)}
                                    disabled={locked}
                                />
                            </div>
                            <div className='right'>
                                <MaterialSymbol $button $size={22} $disabled={locked}
                                    onClick={() => removePort(port.id)}>close</MaterialSymbol>
                            </div>
                        </div>
                        {
                            !locked &&
                            <FormSettingsGridDiv className='details'>
                                <p>Port type</p>
                                <FormSelectOption
                                    options={blueprintOptions}
                                    mapName={blueprintNames}
                                    value={getBlueprintKey(port)}
                                    onChange={bpId => replacePort(port.id, bpId)}
                                />
                            </FormSettingsGridDiv>
                        }
                    </PortDiv>
                </FormSortableListItemDiv>
            )}
        </FormSortableList>
    );
}

export default FlowInspectorPortList;