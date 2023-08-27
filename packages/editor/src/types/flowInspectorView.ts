import { PanelState } from "./panelManager";
import * as lang from '@fluss/language';

export type AllRowSignatures = lang.InputRowSignature | lang.OutputRowSignature;
export type RowSignatureBlueprint = {
    specifier: lang.TypeSpecifier;
    rowType: AllRowSignatures['rowType'];
}

export type FlowPortLists = 'inputs' | 'outputs';
export type FlowInspectorLists = FlowPortLists | 'generics';

export interface FlowInspectorPanelState extends PanelState {
    selectedListItems: Partial<Record<FlowInspectorLists, string>>;
}