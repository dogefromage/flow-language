import React from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { selectEditor } from "../slices/editorSlice";
import { flowsRename, flowsSetAttribute, selectSingleFlow } from "../slices/flowsSlice";
import FlowInspectorPortList from './FlowInspectorPortList';
import FormColorPicker from './FormColorPicker';
import FormExpandableRegion from "./FormExpandableRegion";
import FormRenameField from "./FormRenameField";

const InspectorWrapper = styled.div`
    min-height: 100%;
    overflow-x: hidden;
`

const SettingsTable = styled.div`
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-auto-rows: var(--list-height);
    align-items: center;
    grid-row-gap: var(--list-gap);
`;

interface Props {
    // panelId: string
}

const FlowInspectorContent = ({ /* panelId */ }: Props) => {
    const dispatch = useAppDispatch();
    const flowId = useAppSelector(selectEditor).activeFlow;
    const flow = useAppSelector(selectSingleFlow(flowId!));

    const isLocked = false;

    return (
        <InspectorWrapper>
            <FormExpandableRegion name='Active Flow' defaultValue={true}> {
                (flow && flowId) ? (<>
                    <SettingsTable>
                        <p>Name</p>
                        <FormRenameField
                            value={flow.name}
                            onChange={newName => dispatch(flowsRename({
                                flowId,
                                name: newName,
                                undo: { desc: `Renamed flow '${flow.name}' to '${newName}'.` },
                            }))}
                        />
                        <p>Color</p>
                        <FormColorPicker
                            value={flow.attributes.color || '#000000'}
                            onChange={(newColor, actionToken) => {
                                dispatch(flowsSetAttribute({
                                    flowId,
                                    key: 'color',
                                    value: newColor,
                                    undo: { desc: `Changed active flows color attribute.`, actionToken },
                                }));
                            }}

                        />
                    </SettingsTable>
                    <p>Inputs {isLocked && '(Locked)'}</p>
                    <FlowInspectorPortList flowId={flowId} locked={isLocked} ports={flow.inputs} direction='in' />
                    <p>Outputs {isLocked && '(Locked)'}</p>
                    <FlowInspectorPortList flowId={flowId} locked={isLocked} ports={flow.outputs} direction='out' />
                </>) : (
                    <p>No active flow found</p>
                )
            }
            </FormExpandableRegion>
        </InspectorWrapper>
    );
}

export default FlowInspectorContent;
