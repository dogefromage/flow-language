import React, { useEffect } from "react";
import { useSelectPanelState } from "../redux/panelStateEnhancer";
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

    const editorState = useAppSelector(selectEditor);

    useBindPanelState(
        panelId,
        createFlowEditorPanelState,
        ViewTypes.FlowEditor,
    );

    useEffect(() => {
        dispatch(flowEditorPanelsSetFlowId({
            panelId: panelId,
            flowId: editorState.activeFlow || '',
        }));
    }, [ editorState.activeFlow ]);

    return (
        <PanelBody viewProps={viewProps}>
            <FlowEditorViewport panelId={panelId} />
        </PanelBody>
    )
}

export default FlowEditorView;
