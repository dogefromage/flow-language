import * as lang from "@noodles/language";
import { Vec2 } from "./utils";
import { PanelState } from "./panelManager";

export interface PlanarCamera {
    position: Vec2;
    zoom: number;
}

interface EditorActionLocation {
    worldPosition: Vec2;
    clientPosition: Vec2;
}
export interface DraggingJointContext {
    fromJoint: lang.JointLocation;
    dataType: lang.TypeSpecifier;
    environment: lang.FlowEnvironment;
}

export interface EditorActionNeutralState {
    type: 'neutral';
}
export interface EditorActionAddNodeAtPositionState {
    type: 'add-node-at-position';
    location: EditorActionLocation;
}
export interface EditorActionDraggingLinkState {
    type: 'dragging-link';
    cursorWorldPosition: Vec2 | null;
    draggingContext: DraggingJointContext;
}
export interface EditorActionAddNodeWithConnectionState {
    type: 'add-node-with-connection';
    location: EditorActionLocation;
    draggingContext: DraggingJointContext;
}

export type EditorActionState =
    | EditorActionNeutralState
    | EditorActionAddNodeAtPositionState
    | EditorActionDraggingLinkState
    | EditorActionAddNodeWithConnectionState

export type JointLocationKey = `${string}.${string}.${number}` | `${string}.${string}`;

export type EditorClipboardNodeContent = lang.FlowNode[];

export interface FlowEditorPanelState extends PanelState {
    flowStack: string[];
    camera: PlanarCamera;
    selection: string[];
    state: EditorActionState;
    relativeJointPosition: Map<JointLocationKey, Vec2>;
    clipboard: EditorClipboardNodeContent | null;
}