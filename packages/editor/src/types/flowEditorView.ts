import * as lang from "noodle-language";
import { assert } from "../utils";
import { PanelState } from "./panelManager";
import { Vec2 } from "./utils";

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
    fromJoint: JointLocation;
    syntax: lang.ReferenceSyntacticType;
    // dataType: lang.TExpr;
    // env: lang.EnvScope;
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

interface ArgumentJointLocation {
    kind: 'argument';
    nodeId: string;
    argumentId: string;
    accessor?: string;
} 
interface OutputJointLocation {
    kind: 'output';
    nodeId: string;
    accessor?: string;
}
interface ParameterJointLocation {
    kind: 'parameter';
    nodeId: string;
    parameterId: string;
} 
interface ResultJointLocation {
    kind: 'result';
    nodeId: string;
}
export type JointLocation = ArgumentJointLocation | OutputJointLocation | ParameterJointLocation | ResultJointLocation;
export type JointLocationDigest = string & { __jointLocationDigest: true };

export function jointLocationDirection(loc: JointLocation) {
    switch (loc.kind) {
        case 'argument':
        case 'result':
            return 'input';
        case 'output':
        case 'parameter':
            return 'output';
    }
    assert(0);
}

export interface FlowEdge {
    id: string;
    source: JointLocation;
    target: JointLocation;
}

export interface FlowEditorPanelState extends PanelState {
    flowStack: string[];
    cameras: Record<string, PlanarCamera>;
    state: EditorActionState;
    relativeJointPosition: Map<JointLocationDigest, Vec2>;
}

export interface FlowJointStyling {
    background: string | null;
    border: string | null;
    shape: 'square' | 'round';
    borderStyle: 'dashed' | 'solid';
}

export interface ContextSliceState {
    documentContext: lang.DocumentContext | null;
}

export const EDITOR_ITEM_ID_ATTR = 'data-id';
export const EDITOR_SELECTABLE_ITEM_CLASS = 'editor-selectable-items';
// export const EDITOR_SELECTABLE_ITEM_TYPE_ATTR = 'selectable-type';

export const DEFAULT_EDITOR_CAMERA = { position: { x: 0, y: 0 }, zoom: 1, };

export function getActiveEditorCamera(ps?: FlowEditorPanelState) {
    return ps?.cameras[ps?.flowStack[0]] || DEFAULT_EDITOR_CAMERA;
}
