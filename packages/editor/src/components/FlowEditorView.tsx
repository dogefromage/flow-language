import React, { useEffect } from "react";
import { selectPanelState } from "../redux/panelStateEnhancer";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { selectEditor } from "../slices/editorSlice";
import { createFlowEditorPanelState, flowEditorPanelsSetFlowId } from "../slices/panelFlowEditorSlice";
import { ViewProps, ViewTypes } from "../types";
import { useBindPanelState } from "../utils/panelManager";
import FlowEditorViewport from "./FlowEditorViewport";
import PanelBody from "./PanelBody";

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
