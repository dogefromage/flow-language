import { HocuspocusProvider } from '@hocuspocus/provider';
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import _ from "lodash";
import { enhanceReducer, bind } from 'redux-yjs-bindings';
import * as Y from 'yjs';

export const createStore = _.memoize(() => {


    const store = configureStore({
        reducer: combineReducers({
            document: enhanceReducer((state: any) => state || {}),
        }),
    });

    const yDoc = new Y.Doc();
    const provider = new HocuspocusProvider({
        url: "ws://127.0.0.1:1234",
        name: "example-document",
        document: yDoc,
    });

    // const provider = new WebrtcProvider('flow-typescript-test-room', yDoc, {
    //     signaling: [ 'ws://localhost:4444' ],
    // });
    bind(yDoc, store, 'document');

    // const ytext = ydoc.getText('project');

    // return ytext;
    return store;
});