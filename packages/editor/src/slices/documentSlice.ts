import * as lang from "@noodles/language";
import { AnyAction, createAction } from "@reduxjs/toolkit";
import produce from "immer";
import { createUndoAction } from "../types";
import flowsReducer from "./flowsSlice";
import { RootState } from "../redux/rootReducer";
import { except } from "../utils/exceptions";

export const documentSetTitle = createUndoAction
    <{ title: string }, 'document.setTitle'>('document.setTitle');
export const documentSetDescription = createUndoAction
    <{ description: string }, 'document.setDescription'>('document.setDescription');
export const documentReplace = createAction
    <{ document: lang.FlowDocument }, 'document.replace'>('document.replace');
export const documentRenameFlow = createUndoAction
    <{ oldName: string, newName: string }, 'document.renameFlow'>('document.renameFlow');
export const documentRenameGeneric = createUndoAction
    <{ flowId: string, oldName: string, newName: string }, 'document.renameGeneric'>('document.renameGeneric');
export const documentRenameInput = createUndoAction
    <{ flowId: string, oldName: string, newName: string }, 'document.renameInput'>('document.renameInput');
export const documentRenameOutput = createUndoAction
    <{ flowId: string, newName: string }, 'document.renameOutput'>('document.renameOutput');

function documentReducer(s: lang.FlowDocument | undefined, a: AnyAction): lang.FlowDocument {
    s ||= {
        title: 'New Document',
        description: '',
        flows: flowsReducer(undefined, { type: '' }),
    };

    const newFlowsState = flowsReducer(s.flows, a);
    if (newFlowsState != s.flows) {
        return {
            ...s,
            flows: newFlowsState,
        };
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
        // let reducer run on document, this will initialize newer members which are missing
        return documentReducer(a.payload.document, { type: '' });
    }
    if (documentRenameFlow.match(a)) {
        const builder = new lang.Builder(s);
        const flow = builder.document.flows[a.payload.oldName];
        if (flow == null) {
            except(`Could not find flow with id '${a.payload.oldName}'.`);
        }
        builder.renameItem(flow, a.payload.newName);
        return builder.finalize();
    }
    if (documentRenameGeneric.match(a)) {
        const builder = new lang.Builder(s);
        const generic = builder.document.flows[a.payload.flowId]?.generics
            .find(g => g.id === a.payload.oldName);
        if (generic == null) {
            except(`Could not find flow with id '${a.payload.flowId}' containing generic with id '${a.payload.oldName}'.`);
        }
        builder.renameItem(generic, a.payload.newName);
        return builder.finalize();
    }
    if (documentRenameInput.match(a)) {
        const builder = new lang.Builder(s);
        const input = builder.document.flows[a.payload.flowId]?.inputs
            .find(g => g.id === a.payload.oldName);
        if (input == null) {
            except(`Could not find flow with id '${a.payload.flowId}' containing input with id '${a.payload.oldName}'.`);
        }
        builder.renameItem(input, a.payload.newName);
        return builder.finalize();
    }
    if (documentRenameOutput.match(a)) {
        const builder = new lang.Builder(s);
        const output = builder.document.flows[a.payload.flowId]?.output;
        if (output == null) {
            except(`Could not find flow with id '${a.payload.flowId}'.`);
        }
        builder.renameItem(output, a.payload.newName);
        return builder.finalize();
    }

    return s;
}

export const selectDocument = (state: RootState) => state.document.present;

export default documentReducer;
