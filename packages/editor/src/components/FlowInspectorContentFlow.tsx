import { PropsWithChildren } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { documentRenameFlow } from '../slices/documentSlice';
import { editorSetActiveFlow, selectEditor } from '../slices/editorSlice';
import { useSelectSingleFlow } from '../slices/flowsSlice';
import { FormSettingsTable } from '../styles/formStyles';
import { useFlowNamingValidator } from '../utils/flows';
import FormExpandableRegion from './FormExpandableRegion';
import FormRenameField from './FormRenameField';

interface FlowInspectorContentFlowProps {
    panelId: string;
}

const FlowInspectorContentFlow = ({ panelId }: PropsWithChildren<FlowInspectorContentFlowProps>) => {
    const dispatch = useAppDispatch();
    const flowId = useAppSelector(selectEditor).activeFlow;
    const flow = useAppSelector(useSelectSingleFlow(flowId!));
    const flowNamingValidator = useFlowNamingValidator(flowId);

    if (!flow || !flowId) return null;

    return (
        <FormExpandableRegion name='Active Flow' defaultValue={true}>
            <FormSettingsTable>
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
                {/* <p>Description</p>
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
                /> */}
                {/* <p>Color</p>
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
                /> */}
            </FormSettingsTable>
            {/* <FormSpacer />
            <FormSettingsTable>
                <p>Generics</p>
                <FlowInspectorGenericList panelId={panelId} flowId={flowId} />
                <p>Inputs</p>
                <FlowInspectorInputList panelId={panelId} flowId={flowId} />
                <p>Output</p>
                <FlowInspectorOutput panelId={panelId} flowId={flowId} />
            </FormSettingsTable>
            <FormSpacer />
            <FlowInspectorPortDetails panelId={panelId} flowId={flowId} /> */}
        </FormExpandableRegion>
    );
}

export default FlowInspectorContentFlow;