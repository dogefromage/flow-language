import { PropsWithChildren } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectEditor } from '../slices/editorSlice';
import { flowsSetAttribute, flowsSetRegionAttribute, flowsSetRowValue, flowsUpdateNodeSignature, useSelectSingleFlow } from '../slices/flowsSlice';
import { FormSettingsTable } from '../styles/formStyles';
import FormColorPicker from './FormColorPicker';
import FormExpandableRegion from './FormExpandableRegion';
import FormRenameField from './FormRenameField';
import { REGION_DEFAULT_COLOR_HEX } from '../styles/flowStyles';
import { useAvailableSignatureOptionsData } from '../utils/flows';
import { useSelectFlowContext } from '../slices/contextSlice';
import FormSelectOption from './FormSelectOption';

interface FlowInspectorContentSelectionProps {
    panelId: string;
}

const FlowInspectorContentSelection = ({ panelId }: PropsWithChildren<FlowInspectorContentSelectionProps>) => {
    
    // const flowId = useAppSelector(selectEditor).activeFlow;
    // const flow = useAppSelector(useSelectSingleFlow(flowId!));
    // const selection = useAppSelector(useFlowEditorPanelState(panelId));

    // if (!flow || !flowId) return null;

    const { selection } = useAppSelector(selectEditor);

    let content: React.ReactNode = null;

    if (!selection || selection.items.length == 0) {
        content = (
            <p>Selection is empty.</p>
        );
    }
    else if (selection.items.length > 1) {
        content = (
            <p>Multiple elements selected. Select a single one to edit.</p>
        );
    } 
    else {
        const el = selection.items[0];
        if (el.type === 'region') {
            content = <ContentSelectionRegion flowId={selection.flowId} regionId={el.id} />
        } else if (el.type === 'node') {
            content = <ContentSelectionNode flowId={selection.flowId} nodeId={el.id} />
        } else {
            console.error('missing selection type');
        }
    }

    return (
        <FormExpandableRegion name='Active Element' defaultValue={true}>
            { content }
        </FormExpandableRegion>
    );
}

export default FlowInspectorContentSelection;

interface ContentSelectionRegionProps {
    flowId: string;
    regionId: string;
}

const ContentSelectionRegion = ({ flowId, regionId }: ContentSelectionRegionProps) => {
    const dispatch = useAppDispatch();
    
    const flow = useAppSelector(useSelectSingleFlow(flowId));
    const region = flow?.regions[regionId];
    
    if (!region) {
        return <p>Invalid selection.</p>;
    }

    return (
        <FormSettingsTable>
            <p>Text</p>
            <FormRenameField
                value={region.attributes.text || ''}
                onChange={newValue => {
                    dispatch(flowsSetRegionAttribute({
                        flowId,
                        regionId,
                        key: 'text',
                        value: newValue,
                        undo: { desc: 'Updated text in selected region.' },
                    }));
                }}
            />
            <p>Color</p>
            <FormColorPicker
                value={region.attributes.color || REGION_DEFAULT_COLOR_HEX}
                onChange={(newColor, actionToken) => {
                    dispatch(flowsSetRegionAttribute({
                        flowId,
                        regionId,
                        key: 'color',
                        value: newColor,
                        undo: { desc: `Updated color in selected region.`, actionToken },
                    }));
                }}
            />
        </FormSettingsTable>
    );
}

interface ContentSelectionNodeProps {
    flowId: string;
    nodeId: string;
}

const ContentSelectionNode = ({ flowId, nodeId }: ContentSelectionNodeProps) => {
    const dispatch = useAppDispatch();
    
    const flow = useAppSelector(useSelectSingleFlow(flowId));
    const node = flow?.nodes[nodeId];
    const context = useAppSelector(useSelectFlowContext(flowId));
    
    if (!node) {
        return <p>Invalid selection.</p>;
    }

    const { names, options } = useAvailableSignatureOptionsData(context?.flowEnvironment);

    return (
        <FormSettingsTable>
            <p>Function</p>
            <FormSelectOption
                value={node.signature.path}
                options={options}
                mapName={names}
                onChange={newSignatureId => {
                    dispatch(flowsUpdateNodeSignature({
                        flowId, nodeId,
                        signature: { path: newSignatureId },
                        undo: { desc: 'Updated selected nodes signature.' },
                    }));
                }}
            />
        </FormSettingsTable>
    );
}