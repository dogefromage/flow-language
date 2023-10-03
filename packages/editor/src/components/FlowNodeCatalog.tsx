import { FlowSignature, JointLocation, isSubsetType, collectTotalEnvironmentContent } from "@fluss/language";
import React, { useCallback, useMemo } from "react";
import { selectPanelState } from "../redux/panelStateEnhancer";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { AppDispatch } from "../redux/store";
import { selectFlowContext } from "../slices/contextSlice";
import { flowsAddConnection, flowsAddNode } from "../slices/flowsSlice";
import { selectSingleMenu } from "../slices/menusSlice";
import { flowEditorSetStateNeutral } from "../slices/panelFlowEditorSlice";
import { FLOW_NODE_MIN_WIDTH } from "../styles/flowStyles";
import { EditorActionAddNodeAtPositionState, EditorActionAddNodeWithConnectionState, EditorActionState, FloatingMenuShape, MenuElement, SearchMenuElement, TitleMenuElement, Vec2, ViewTypes } from "../types";
import MenuRootFloating from "./MenuRootFloating";

interface Props {
    panelId: string;
}

const FlowNodeCatalog = ({ panelId }: Props) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowEditor, panelId));
    const flowId = panelState?.flowStack[0];
    const graphValidation = useAppSelector(selectFlowContext(flowId!));

    const menuId = `template-catalog:${flowId}`;
    const menuState = useAppSelector(selectSingleMenu(menuId));
    const searchValue: string = menuState?.state.get(SEARCH_ELEMENT_KEY) ?? '';

    const catalogState = panelState && isCatalogOpen(panelState.state) && panelState.state || undefined;

    const addNode = useCallback((signature: FlowSignature) => {
        if (!flowId || !catalogState) return;
        createAddFlowAction(flowId, signature, catalogState, dispatch);
    }, [flowId, catalogState, dispatch]);

    const environmentSignatures = useMemo(() => {
        if (!graphValidation?.flowEnvironment) {
            return;
        }
        const envContent = collectTotalEnvironmentContent(graphValidation?.flowEnvironment);
        return Array.from(Object.values(envContent.signatures || []));
    }, [graphValidation?.flowEnvironment]);

    const menuShape = useMemo(() => {
        if (!environmentSignatures) return;
        return generateCatalogMenuShape(environmentSignatures, searchValue, addNode);
    }, [environmentSignatures, searchValue, addNode,]);

    if (!menuShape || !catalogState) return null;

    return (
        <MenuRootFloating
            menuId={menuId}
            menuType={'misc'}
            shape={menuShape}
            onClose={() => {
                dispatch(flowEditorSetStateNeutral({ panelId }))
            }}
            initialFocusPath="1"
            anchor={catalogState.location.clientPosition}
        />
    );
}

export default FlowNodeCatalog;

const SEARCH_ELEMENT_KEY = 'search';

type AddNodeState = EditorActionAddNodeAtPositionState | EditorActionAddNodeWithConnectionState;
function isCatalogOpen(
    state: EditorActionState
): state is AddNodeState {
    return state.type === 'add-node-at-position' || state.type === 'add-node-with-connection'
}

function generateCatalogMenuShape(
    signatures: FlowSignature[],
    searchValue: string,
    addNode: (signature: FlowSignature) => void,
) {
    const title: TitleMenuElement = {
        type: 'title',
        key: 'title',
        name: 'Add Template',
        color: 'black',
    }
    const searchBar: SearchMenuElement = {
        key: SEARCH_ELEMENT_KEY,
        type: 'search',
        name: 'search',
        placeholder: 'Search...',
        autofocus: true,
    };

    if (searchValue.length > 0) {
        // render filtered
        const filtered = signatures
            .filter(t => t.id.toLowerCase().includes(searchValue.toLowerCase()));

        const listTemplates: MenuElement[] = filtered.map(signature => ({
            type: 'button',
            key: signature.id,
            name: signature.id,
            onClick: () => addNode(signature),
        }));

        const menuShape: FloatingMenuShape = {
            type: 'floating',
            list: [
                title,
                searchBar,
                ...listTemplates,
            ],
        }
        return menuShape;
    } else {
        // render grouped
        const groupedTemplatesMap = signatures
            .reduce((groupes, current) => {
                const key = current!.attributes?.category || 'Other';
                if (groupes[key] == null) { groupes[key] = []; }
                groupes[key]!.push(current!);
                return groupes;
            }, {} as Record<string, FlowSignature[]>);

        const sortedGroupes = Object.entries(groupedTemplatesMap)
            .sort(([a], [b]) => a.localeCompare(b));

        const groupedList: MenuElement[] = sortedGroupes.map(([category, tempOfGroup]) => ({
            type: 'expand',
            key: category,
            name: category,
            sublist: {
                type: 'floating',
                list: tempOfGroup.map(template => ({
                    type: 'button',
                    key: template.id,
                    name: template.id,
                    onClick: () => addNode(template),
                }))
            }
        }));
        const menuShape: FloatingMenuShape = {
            type: 'floating',
            list: [
                title,
                searchBar,
                ...groupedList,
            ],
        }
        return menuShape;
    }
}
function createAddFlowAction(flowId: string, signature: FlowSignature, addNodeState: AddNodeState, dispatch: AppDispatch) {
    let nodePosition = addNodeState.location.worldPosition;

    if (addNodeState.type === 'add-node-at-position') {
        dispatch(createBasicAddNodeAction(flowId, signature.id, nodePosition));
        return;
    }

    // find first opposite sided row with compatible type
    const drag = addNodeState.draggingContext;
    const connectionColumn = drag.fromJoint.direction === 'input' ?
        [signature.output] : signature.inputs;
    let compatibleRowId: string | undefined;
    for (const row of connectionColumn) {
        if (isSubsetType(row.specifier, drag.dataType, drag.environment)) {
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
    dispatch(createBasicAddNodeAction(flowId, signature.id, nodePosition));

    // if still no row
    if (compatibleRowId == null) {
        return;
    }

    let newLocation: JointLocation = drag.fromJoint.direction === 'input' ?
        ({ nodeId: '*', direction: 'output', }) :
        ({ nodeId: '*', rowId: compatibleRowId, direction: 'input', accessor: '0' });

    dispatch(flowsAddConnection({
        flowId,
        locations: [drag.fromJoint, newLocation],
        undo: { desc: 'Added link to newly created node.' },
        // strategy: 'static',
    }));
}

function createBasicAddNodeAction(flowId: string, signatureId: string, position: Vec2) {
    return flowsAddNode({
        flowId, signatureId, position,
        undo: { desc: `Added new node to active flow.` },
    });
}