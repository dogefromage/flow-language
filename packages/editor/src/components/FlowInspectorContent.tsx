import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { editorSetActiveFlow, selectEditor } from "../slices/editorSlice";
import { flowsSetAttribute, useSelectSingleFlow } from "../slices/flowsSlice";
import FlowInspectorGenericList from "./FlowInspectorGenericList";
import FlowInspectorInputList from './FlowInspectorInputList';
import FlowInspectorOutput from './FlowInspectorOutput';
import FlowInspectorPortDetails from './FlowInspectorPortDetails';
import FormColorPicker from './FormColorPicker';
import FormExpandableRegion from "./FormExpandableRegion";
import FormRenameField from "./FormRenameField";
import { documentSetTitle, documentSetDescription, selectDocument, documentRenameFlow } from "../slices/documentSlice";
import { useFlowNamingValidator } from "../utils/flows";

const InspectorWrapper = styled.div`
    min-height: 100%;
    overflow-x: hidden;
    container-type: size;
`;

const SettingsTable = styled.div`
    display: grid;
    grid-template-columns: 120px 1fr;
    /* grid-auto-rows: var(--list-height); */
    /* align-items: center; */
    grid-row-gap: var(--list-gap);

    @container (max-width: 300px) {
        grid-template-columns: 1fr;
    }
`;

interface Props {
    panelId: string
}

const FlowInspectorContent = ({ panelId }: Props) => {
    const dispatch = useAppDispatch();
    const document = useAppSelector(selectDocument);
    const flowId = useAppSelector(selectEditor).activeFlow;
    const flow = document.flows[flowId!];
    const flowNamingValidator = useFlowNamingValidator(flowId);

    return (
        <InspectorWrapper>
            <FormExpandableRegion name='Document' defaultValue={true}>
                <SettingsTable>
                    <p>Title</p>
                    <FormRenameField
                        value={document.title}
                        onChange={newValue => {
                            dispatch(documentSetTitle({
                                title: newValue,
                                undo: { desc: `Updated document title to '${newValue}'.` },
                            }));
                        }}
                    />
                    <p>Description</p>
                    <FormRenameField
                        value={document.description}
                        onChange={newValue => {
                            dispatch(documentSetDescription({
                                description: newValue,
                                undo: { desc: `Updated document description to '${newValue}'.` },
                            }));
                        }}
                    />
                </SettingsTable>
            </FormExpandableRegion> {
                (flow && flowId) && (<>
                    <FormExpandableRegion name='Flow Attributes' defaultValue={true}>
                        <SettingsTable>
                            <p>Name</p>
                            <FormRenameField
                                value={flow.id}
                                onValidate={flowNamingValidator}
                                onChange={newName => {
                                    dispatch(documentRenameFlow({
                                        oldName: flowId,
                                        newName,
                                        undo: { desc: `Renamed flow from '${flowId}' to '${newName}'.` },
                                    }));
                                    dispatch(editorSetActiveFlow({
                                        flowId: newName,
                                    }));
                                }}
                            />
                            <p>Description</p>
                            <FormRenameField
                                value={flow.attributes.description || ''}
                                onChange={newValue => {
                                    dispatch(flowsSetAttribute({
                                        flowId,
                                        key: 'description',
                                        value: newValue,
                                        undo: { desc: `Changed active flows description attribute.` },
                                    }));
                                }}
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
                    <FormExpandableRegion name='Flow Signature' defaultValue={true}>
                        <SettingsTable>
                            <p>Generics</p>
                            <FlowInspectorGenericList panelId={panelId} flowId={flowId} />
                            <p>Inputs</p>
                            <FlowInspectorInputList panelId={panelId} flowId={flowId} />
                            <p>Output</p>
                            <FlowInspectorOutput panelId={panelId} flowId={flowId} />
                        </SettingsTable>
                    </FormExpandableRegion>
                    <FormExpandableRegion name='Port Details' defaultValue={true}>
                        <FlowInspectorPortDetails panelId={panelId} flowId={flowId} />
                    </FormExpandableRegion>
                </>)
            }
        </InspectorWrapper>
    );
}

export default FlowInspectorContent;
