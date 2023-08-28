import React from "react";
import styled from "styled-components";
import { selectPanelState } from "../redux/panelStateEnhancer";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { selectFlowContext } from "../slices/contextSlice";
import { selectEditor } from "../slices/editorSlice";
import { flowsRename, flowsSetAttribute, selectSingleFlow } from "../slices/flowsSlice";
import { ViewTypes } from "../types";
import FlowInspectorPortDetails from "./FlowInspectorPortDetails";
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
    panelId: string
}

const FlowInspectorContent = ({ panelId }: Props) => {
    const dispatch = useAppDispatch();
    const flowId = useAppSelector(selectEditor).activeFlow;
    const flow = useAppSelector(selectSingleFlow(flowId!));
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowInspector, panelId));

    return (
        <InspectorWrapper>{
            (flow && flowId) ? (<>
                <FormExpandableRegion name='Flow Attributes' defaultValue={true}>
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
                </FormExpandableRegion>

                <FormExpandableRegion name='Inputs' defaultValue={true}>
                    <FlowInspectorPortList panelId={panelId} flowId={flowId} ports={flow.inputs} portType='inputs' />
                    {
                        panelState?.selectedListItems['inputs'] != null &&
                        <FlowInspectorPortDetails panelId={panelId} flowId={flowId} portType={'inputs'}
                            portId={panelState?.selectedListItems['inputs']} />
                    }
                </FormExpandableRegion>


                <FormExpandableRegion name='Outputs' defaultValue={true}>
                    <FlowInspectorPortList panelId={panelId} flowId={flowId} ports={[ flow.output ]} portType='outputs' />
                    {
                        panelState?.selectedListItems['outputs'] != null &&
                        <FlowInspectorPortDetails panelId={panelId} flowId={flowId} portType={'outputs'}
                            portId={panelState?.selectedListItems['outputs']} />
                    }
                </FormExpandableRegion>
            </>) : (
                <p>No active flow found</p>
            )
        }
        </InspectorWrapper>
    );
}

export default FlowInspectorContent;
