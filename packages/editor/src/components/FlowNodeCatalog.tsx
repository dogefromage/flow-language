import * as lang from "noodle-language";
import { NamespacePath } from "noodle-language";
import { useCallback, useMemo, useState } from "react";
import { AppDispatch } from "../redux/rootReducer";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { useSelectFlowContext } from "../slices/contextSlice";
import { flowsAddConnection, flowsAddNode } from "../slices/flowsSlice";
import { flowEditorSetStateNeutral, useSelectFlowEditorPanel } from "../slices/panelFlowEditorSlice";
import { FLOW_NODE_MIN_WIDTH } from "../styles/flowStyles";
import { EditorActionAddNodeAtPositionState, EditorActionAddNodeWithConnectionState, EditorActionState, Vec2 } from "../types";
import Menus from "./Menus";

interface Props {
    panelId: string;
}

const FlowNodeCatalog = ({ panelId }: Props) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(useSelectFlowEditorPanel(panelId));
    const flowId = panelState?.flowStack[0];
    const graphValidation = useAppSelector(useSelectFlowContext(flowId!));

    const [searchValue, setSearchValue] = useState('');

    const catalogState = panelState && isCatalogOpen(panelState.state) && panelState.state || undefined;

    const addNode = useCallback((signaturePath: lang.NamespacePath, signature: lang.FlowSignature) => {
        if (!flowId || !catalogState) return;
        createAddFlowAction(flowId, signaturePath, signature, catalogState, dispatch);
    }, [flowId, catalogState, dispatch]);

    const environmentSignatures = useMemo(() => {
        if (!graphValidation?.flowEnvironment) {
            return;
        }
        const envContent = lang.collectTotalEnvironmentContent(graphValidation?.flowEnvironment);
        return envContent.signatures;
    }, [graphValidation?.flowEnvironment]);

    function closeMenu() {
        dispatch(flowEditorSetStateNeutral({ panelId }));
        setSearchValue('');
    }

    if (!catalogState) return null;

    return (
        <Menus.RootFloating menuId={`template-catalog:${flowId}`} onClose={closeMenu}
            anchor={catalogState.location.clientPosition} initialFocusPath={[0]}>
            <Menus.Title name='Add Template' color='black' />
            <Menus.Search value={searchValue} placeholder='Search...'
                onChange={setSearchValue} /> {
                environmentSignatures &&
                <CatalogContent searchValue={searchValue} signatures={environmentSignatures}
                    addNode={addNode} />
            }
        </Menus.RootFloating>
    );
}

export default FlowNodeCatalog;

interface CatalogContentProps {
    searchValue: string;
    signatures: Record<string, lang.FlowSignature>;
    addNode: (signaturePath: lang.NamespacePath, signature: lang.FlowSignature) => void;
}
const CatalogContent = ({ searchValue, signatures, addNode }: CatalogContentProps) => {

    if (searchValue.length > 0) {
        // render filtered
        const filtered = lang.utils.filterObj(signatures,
            t => t.id.toLowerCase().includes(searchValue.toLowerCase()));

        return Object.entries(filtered).map(([path, signature]) =>
            <Menus.Button key={path} name={signature.id}
                onPush={() => addNode({ path }, signature)} />
        );
    }

    // render grouped
    const groupedTemplatesMap = Object.entries(signatures)
        .reduce((groupes, current) => {
            const key = current![1].attributes?.category || 'Other';
            if (groupes[key] == null) { groupes[key] = []; }
            groupes[key]!.push(current!);
            return groupes;
        }, {} as Record<string, [string, lang.FlowSignature][]>);

    const sortedGroupes = Object.entries(groupedTemplatesMap)
        .sort(([a], [b]) => a.localeCompare(b));

    return sortedGroupes.map(([category, tempOfGroup]) =>
        <Menus.Expand key={category} name={category}> {
            tempOfGroup.map(([path, signature]) =>
                <Menus.Button key={path} name={signature.id}
                    onPush={() => addNode({ path }, signature)} />
            )
        }
        </Menus.Expand>
    );
}

type AddNodeState = EditorActionAddNodeAtPositionState | EditorActionAddNodeWithConnectionState;
function isCatalogOpen(
    state: EditorActionState
): state is AddNodeState {
    return state.type === 'add-node-at-position' || state.type === 'add-node-with-connection'
}

function createAddFlowAction(flowId: string, signaturePath: NamespacePath, 
    signature: lang.FlowSignature, addNodeState: AddNodeState, dispatch: AppDispatch) {
    let nodePosition = addNodeState.location.worldPosition;

    if (addNodeState.type === 'add-node-at-position') {
        dispatch(createBasicAddNodeAction(flowId, signaturePath, nodePosition));
        return;
    }

    // find first opposite sided row with compatible type
    const drag = addNodeState.draggingContext;
    const connectionColumn = drag.fromJoint.direction === 'input' ?
        [signature.output] : signature.inputs;
    let compatibleRowId: string | undefined;
    for (const row of connectionColumn) {
        if (lang.isSubsetType(row.specifier, drag.dataType, drag.environment)) {
            compatibleRowId = row.id;
            break;
        }
    }
    // default to first otherwise
    if (compatibleRowId == null && connectionColumn.length > 0) {
        compatibleRowId = connectionColumn[0].id;
    }

    // offset to left if adding to input
    if (drag.fromJoint.direction === 'input') {
        nodePosition = {
            x: nodePosition.x - FLOW_NODE_MIN_WIDTH,
            y: nodePosition.y,
        };
    }
    dispatch(createBasicAddNodeAction(flowId, signaturePath, nodePosition));

    // if still no row
    if (compatibleRowId == null) {
        return;
    }

    let newLocation: lang.JointLocation = drag.fromJoint.direction === 'input' ?
        ({ nodeId: '*', direction: 'output', }) :
        ({ nodeId: '*', rowId: compatibleRowId, direction: 'input', accessor: '0' });

    dispatch(flowsAddConnection({
        flowId,
        locations: [drag.fromJoint, newLocation],
        undo: { desc: 'Added link to newly created node.' },
        syntax: drag.syntax,
    }));
}

function createBasicAddNodeAction(flowId: string, signature: lang.NamespacePath, position: Vec2) {
    return flowsAddNode({
        flowId, signature, position,
        undo: { desc: `Added new node to active flow.` },
    });
}