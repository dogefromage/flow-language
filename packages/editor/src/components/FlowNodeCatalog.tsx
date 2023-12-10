import { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { useSelectFlowContext } from "../slices/contextSlice";
import { flowEditorSetStateNeutral, useSelectFlowEditorPanel } from "../slices/panelFlowEditorSlice";
import { EditorActionAddNodeAtPositionState, EditorActionAddNodeWithConnectionState, EditorActionState, Vec2 } from "../types";
import Menus from "./Menus";
import * as lang from 'noodle-language';
import { AppDispatch } from "../redux/rootReducer";
import { flowsAddCallNode } from "../slices/flowsSlice";

interface Props {
    panelId: string;
}

const FlowNodeCatalog = ({ panelId }: Props) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(useSelectFlowEditorPanel(panelId));
    const flowId = panelState?.flowStack[0];
    const graphContext = useAppSelector(useSelectFlowContext(flowId!));

    const [searchValue, setSearchValue] = useState('');

    const catalogState = panelState && isCatalogOpen(panelState.state) && panelState.state || undefined;

    const addNode = useCallback((signaturePath: lang.NamespacePath, signature: lang.FunctionSignature) => {
        if (!flowId || !catalogState) return;
        createAddFlowAction(flowId, signaturePath, signature, catalogState, dispatch);
    }, [flowId, catalogState, dispatch]);

    // const environmentSignatures = useMemo(() => {
    //     if (!graphContext?.flowEnvironment) {
    //         return;
    //     }
    //     const envContent = lang.collectTotalEnvironmentContent(graphContext?.flowEnvironment);
    //     return envContent.signatures;
    // }, [graphContext?.flowEnvironment]);

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
                graphContext &&
                <CatalogContent searchValue={searchValue} env={graphContext.env}
                    addNode={addNode} />
            }
        </Menus.RootFloating>
    );
}

export default FlowNodeCatalog;

interface CatalogContentProps {
    searchValue: string;
    env: lang.Environment;
    addNode: (signaturePath: lang.NamespacePath, signature: lang.FunctionSignature) => void;
}
const CatalogContent = ({ searchValue, env, addNode }: CatalogContentProps) => {

    const functionMap = useMemo(() => {
        const funs: Record<string, lang.FunctionSignature> = {};
        while (env != null) {
            if (env.scope.kind === 'flow') {
                for (const [ funId, fun ] of Object.entries(env.scope.functions)) {
                    funs[`${env.scope.flowId}/${funId}`] = fun;
                }
            }
            if (env.scope.kind === 'module') {
                for (const [ flowId, flow ] of Object.entries(env.scope.flows)) {
                    for (const [ funId, fun ] of Object.entries(flow.functions)) {
                        funs[`${env.scope.name}/${flowId}/${funId}`] = fun;
                    }
                }
            }
            env = env.parent!;
        }
        return funs;
    }, [ env ]);

    return Object.entries(functionMap).map(([path, sig]) =>
        <Menus.Button key={path} name={path}
            onPush={() => addNode(path as lang.NamespacePath, sig)} />
    );

    // if (searchValue.length > 0) {
    //     // render filtered
    //     const filtered = lang.utils.filterObj(signatures,
    //         t => t.id.toLowerCase().includes(searchValue.toLowerCase()));

    //     return Object.entries(filtered).map(([path, signature]) =>
    //         <Menus.Button key={path} name={signature.id}
    //             onPush={() => addNode({ path }, signature)} />
    //     );
    // }

    // // render grouped
    // const groupedTemplatesMap = Object.entries(signatures)
    //     .reduce((groupes, current) => {
    //         const key = current![1].attributes?.category || 'Other';
    //         if (groupes[key] == null) { groupes[key] = []; }
    //         groupes[key]!.push(current!);
    //         return groupes;
    //     }, {} as Record<string, [string, lang.FlowSignature][]>);

    // const sortedGroupes = Object.entries(groupedTemplatesMap)
    //     .sort(([a], [b]) => a.localeCompare(b));

    // return sortedGroupes.map(([category, tempOfGroup]) =>
    //     <Menus.Expand key={category} name={category}> {
    //         tempOfGroup.map(([path, signature]) =>
    //             <Menus.Button key={path} name={signature.id}
    //                 onPush={() => addNode({ path }, signature)} />
    //         )
    //     }
    //     </Menus.Expand>
    // );
}

type AddNodeState = EditorActionAddNodeAtPositionState | EditorActionAddNodeWithConnectionState;
function isCatalogOpen(
    state: EditorActionState
): state is AddNodeState {
    return state.type === 'add-node-at-position' || state.type === 'add-node-with-connection'
}

function createAddFlowAction(flowId: string, signaturePath: lang.NamespacePath, 
    signature: lang.FunctionSignature, addNodeState: AddNodeState, dispatch: AppDispatch) {
    let nodePosition = addNodeState.location.worldPosition;

    if (true /* addNodeState.type === 'add-node-at-position' */) {
        dispatch(createBasicAddNodeAction(flowId, signaturePath, signature, nodePosition));
        return;
    }

    // // find first opposite sided row with compatible type
    // const drag = addNodeState.draggingContext;
    // const connectionColumn = drag.fromJoint.direction === 'input' ?
    //     [signature.output] : signature.inputs;
    // let compatibleRowId: string | undefined;
    // for (const row of connectionColumn) {
    //     if (lang.isSubsetType(row.specifier, drag.dataType, drag.env)) {
    //         compatibleRowId = row.id;
    //         break;
    //     }
    // }
    // // default to first otherwise
    // if (compatibleRowId == null && connectionColumn.length > 0) {
    //     compatibleRowId = connectionColumn[0].id;
    // }

    // // offset to left if adding to input
    // if (drag.fromJoint.direction === 'input') {
    //     nodePosition = {
    //         x: nodePosition.x - FLOW_NODE_MIN_WIDTH,
    //         y: nodePosition.y,
    //     };
    // }
    // dispatch(createBasicAddNodeAction(flowId, signaturePath, nodePosition));

    // // if still no row
    // if (compatibleRowId == null) {
    //     return;
    // }

    // let newLocation: lang.JointLocation = drag.fromJoint.direction === 'input' ?
    //     ({ nodeId: '*', direction: 'output', }) :
    //     ({ nodeId: '*', rowId: compatibleRowId, direction: 'input', accessor: '0' });

    // dispatch(flowsAddConnection({
    //     flowId,
    //     locations: [drag.fromJoint, newLocation],
    //     undo: { desc: 'Added link to newly created node.' },
    //     syntax: drag.syntax,
    // }));
}

function createBasicAddNodeAction(flowId: string, path: lang.NamespacePath, signature: lang.FunctionSignature, position: Vec2) {
    return flowsAddCallNode({
        flowId, 
        signaturePath: path,
        signature,
        position,
        undo: { desc: `Added new call node to active flow.` },
    });
}