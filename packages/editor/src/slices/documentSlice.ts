import { AnyAction, createAction } from "@reduxjs/toolkit";
import produce from "immer";
import * as lang from "noodle-language";
import { RootState } from "../redux/rootReducer";
import { createUndoAction } from "../types";
import { except } from "../utils";
import flowsReducer from "./flowsSlice";

export const documentSetTitle = createUndoAction
    <{ title: string }, 'document.setTitle'>('document.setTitle');
export const documentSetDescription = createUndoAction
    <{ description: string }, 'document.setDescription'>('document.setDescription');
export const documentReplace = createAction
    <{ document: lang.FlowDocument }, 'document.replace'>('document.replace');
export const documentUpgradeAndReplace = createAction
    <{ document: lang.FlowDocument }, 'document.upgradeAndReplace'>('document.upgradeAndReplace');
export const documentRenameFlow = createUndoAction
    <{ oldName: string, newName: string }, 'document.renameFlow'>('document.renameFlow');
export const documentRenameFunctionParameter = createUndoAction
    <{ flowId: string, nodeId: string, oldName: string, newName: string }, 'document.renameFunctionParameter'>('document.renameFunctionParameter');

function documentReducer(s: lang.FlowDocument | undefined, a: AnyAction): lang.FlowDocument {
    s ||= {
        title: 'New Document',
        description: '',
        flows: flowsReducer(undefined, { type: '' }),
    };

    const newFlowsState = flowsReducer(s.flows, a);
    if (newFlowsState != s.flows) {
        return { ...s, flows: newFlowsState };
    }

    if (documentSetTitle.match(a)) {
        return produce(s, s => {
            s.title = a.payload.title;
        });
    }
    if (documentSetDescription.match(a)) {
        return produce(s, s => {
            s.description = a.payload.description;
        });
    }
    if (documentReplace.match(a)) {
        return a.payload.document;
    }
    if (documentUpgradeAndReplace.match(a)) {
        return lang.updateObsoleteDocument(a.payload.document);
    }
    if (documentRenameFlow.match(a)) {
        except('Implement Builder');
        // const builder = new lang.Builder(s);
        // const flow = builder.document.flows[a.payload.oldName];
        // if (flow == null) {
        //     except(`Could not find flow with id '${a.payload.oldName}'.`);
        // }
        // builder.renameItem(flow, a.payload.newName);
        // return builder.finalize();
    }
    if (documentRenameFunctionParameter.match(a)) {
        except('Implement Builder');
        // const builder = new lang.Builder(s);
        // const generic = builder.document.flows[a.payload.flowId]?.generics
        //     .find(g => g.id === a.payload.oldName);
        // if (generic == null) {
        //     except(`Could not find flow with id '${a.payload.flowId}' containing generic with id '${a.payload.oldName}'.`);
        // }
        // builder.renameItem(generic, a.payload.newName);
        // return builder.finalize();
    }

    return s;
}

export const selectDocument = (state: RootState) => state.document.present;

export default documentReducer;
