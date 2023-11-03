import styled from "styled-components";
import { selectDocument, useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { documentHeaderSetDescription, documentHeaderSetTitle } from "../slices/documentHeaderSlice";
import { selectEditor } from "../slices/editorSlice";
import { flowsSetAttribute, useSelectSingleFlow } from "../slices/flowsSlice";
import FlowInspectorGenericList from "./FlowInspectorGenericList";
import FlowInspectorInputList from './FlowInspectorInputList';
import FlowInspectorOutput from './FlowInspectorOutput';
import FlowInspectorPortDetails from './FlowInspectorPortDetails';
import FormColorPicker from './FormColorPicker';
import FormExpandableRegion from "./FormExpandableRegion";
import FormRenameField from "./FormRenameField";

const InspectorWrapper = styled.div`
    min-height: 100%;
    overflow-x: hidden;
`

const SettingsTable = styled.div`
    display: grid;
    grid-template-columns: 120px 1fr;
    /* grid-auto-rows: var(--list-height); */
    /* align-items: center; */
    grid-row-gap: var(--list-gap);
`;

interface Props {
    panelId: string
}

const FlowInspectorContent = ({ panelId }: Props) => {
    const dispatch = useAppDispatch();
    const flowId = useAppSelector(selectEditor).activeFlow;
    const flow = useAppSelector(useSelectSingleFlow(flowId!));
    const document = useAppSelector(selectDocument);

    return (
        <InspectorWrapper>
            <FormExpandableRegion name='Document' defaultValue={true}>
                <SettingsTable>
                    <p>Title</p>
                    <FormRenameField
                        value={document.header.title}
                        onChange={newValue => {
                            dispatch(documentHeaderSetTitle({ 
                                title: newValue,
                                undo: { desc: `Updated document title to '${newValue}'.` },
                            }));
                        }}
                    />
                    <p>Description</p>
                    <FormRenameField
                        value={document.header.description}
                        onChange={newValue => {
                            dispatch(documentHeaderSetDescription({ 
                                description: newValue,
                                undo: { desc: `Updated document description to '${newValue}'.` },
                            }));
                        }}
                    />
                </SettingsTable>
            </FormExpandableRegion> {
                (flow && flowId) ? (<>
                    <FormExpandableRegion name='Flow Attributes' defaultValue={true}>
                        <SettingsTable>
                            <p>Name</p>
                            <FormRenameField
                                value={flow.id}
                                onValidate={() => {
                                    return {
                                        message: 'Renaming of flows currently not implemented.',
                                    };
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
                </>) : (
                    <p>No active flow found</p>
                )
            }
        </InspectorWrapper>
    );
}

export default FlowInspectorContent;
