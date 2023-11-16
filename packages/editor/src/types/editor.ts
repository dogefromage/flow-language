import * as lang from "noodle-language";

export interface EditorClipboardData {
    snapshot: lang.FlowDocument;
    selection: lang.FlowSelection;
}

export interface EditorSliceState {
    activeFlow?: string;
    selection: lang.FlowSelection | null;
    clipboard: EditorClipboardData | null;
}
