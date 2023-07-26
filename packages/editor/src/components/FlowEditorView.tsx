import React, { useEffect } from "react";
import { createFlowEditorPanelState, flowEditorPanelsSetFlowId } from "../slices/panelFlowEditorSlice";
import { useBindPanelState } from "../utils/panelManager";
import FlowEditorViewport from "./FlowEditorViewport";
import { selectPanelState } from "../redux/panelStateEnhancer";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { ViewProps, ViewTypes, BASE_FLOW_ID } from "../types";
import PanelBody from "./PanelBody";
import { selectEditor } from "../slices/editorSlice";

const FlowEditorView = (viewProps: ViewProps) => {
    const dispatch = useAppDispatch();
    const { panelId } = viewProps;
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowEditor, panelId));

    const editorState = useAppSelector(selectEditor);

    useBindPanelState(
        panelId,
        createFlowEditorPanelState,
        ViewTypes.FlowEditor,
    );

    // useEffect(() => {
    //     if (panelState?.flowStack && panelState.flowStack.length === 0) {
    //         dispatch(flowEditorPanelsSetFlowId({
    //             panelId: panelId,
    //             flowId: ROOT_FLOW_ID,
    //         }));
    //     }
    // }, [panelState?.flowStack]);

    useEffect(() => {
        dispatch(flowEditorPanelsSetFlowId({
            panelId: panelId,
            flowId: editorState.activeFlow || '',
        }));
    }, [ editorState.activeFlow ]);

    return (
        <PanelBody viewProps={viewProps}>
            {/* <FlowNavigatorBar panelId={panelId} /> */}
            <FlowEditorViewport panelId={panelId} />
            {/* <ReflexContainer orientation='vertical'>
                <ReflexElement>
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement size={400}>
                    <GeometryEditorInspector panelId={panelId} />
                </ReflexElement>
            </ReflexContainer> */}
        </PanelBody>
    )
}

export default FlowEditorView;
