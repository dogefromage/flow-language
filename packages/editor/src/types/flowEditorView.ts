import * as lang from "noodle-language";
import { Vec2 } from "./utils";
import { PanelState } from "./panelManager";

export const FLOW_EDITOR_VIEW_TYPE = 'flow-editor';

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

export interface EditorClipboardNodeContent {
    flow: lang.FlowGraph;
    selection: lang.FlowSelection;
}

export interface FlowEditorPanelState extends PanelState {
    flowStack: string[];
    camera: PlanarCamera;
    selection: lang.FlowSelection;
    state: EditorActionState;
    relativeJointPosition: Map<JointLocationKey, Vec2>;
    clipboard: EditorClipboardNodeContent | null;
}

export interface FlowJointStyling {
    background: string | null;
    border: string | null;
    shape: 'square' | 'round';
    borderStyle: 'dashed' | 'solid';
}

export type FlowConnectingStrategy = 'list' | 'static';

export interface ContextSliceState {
    documentContext: lang.FlowDocumentContext | null;
}

export const EDITOR_ITEM_ID_ATTR = 'data-id';
export const EDITOR_SELECTABLE_ITEM_CLASS = 'editor-selectable-items';
export const EDITOR_SELECTABLE_ITEM_TYPE_ATTR = 'selectable-type';
