import { AnyAction, configureStore, Dispatch, Middleware, ThunkDispatch } from "@reduxjs/toolkit";
import { CurriedGetDefaultMiddleware } from "@reduxjs/toolkit/dist/getDefaultMiddleware";
import _ from "lodash";
import rootReducer from "./rootReducer";
import { validatorMiddleware } from "./validatorMiddleware";
import { enableMapSet } from "immer";

function generateMiddleware(getDefaultMiddleWare: CurriedGetDefaultMiddleware) {
    const middleware: Middleware[] = getDefaultMiddleWare({
        serializableCheck: {
            ignoredPaths: [
                // 'document.present.context',
                // 'document.past',
                // 'document.future',
                'context',
                'panelManager',
                'panels',
                'commands',
                'menus',
            ],
            ignoreActions: true,
        },
    });

    // validates document (IMPORTANT)
    middleware.push(validatorMiddleware);

    // middleware.push(createLogger({
    //     collapsed: true,
    //     actionTransformer: (action: UndoAction) => {
    //         if (action.payload?.undo != null) {
    //             console.log("[Undo] " + action.payload.undo.desc);
    //         }
    //         return action;
    //     }
    // }));

    return middleware;
}

export const initStore = _.memoize(() => {
    console.log('enabled map set');
    enableMapSet()

    const store = configureStore({
        reducer: rootReducer,
        middleware: generateMiddleware,
    });

    // const yDoc = new Y.Doc();

    // const provider = new HocuspocusProvider({
    //     url: "ws://127.0.0.1:1234",
    //     name: "example-document",
    //     document: yDoc,
    // });

    // const provider = new WebrtcProvider('flow-typescript-test-room', yDoc, {
    //     signaling: [ 'ws://localhost:4444' ],
    // });

    // bind(yDoc, store, 'document');

    // provider.awareness.setLocalState({
    //     name: Math.random(),
    // })
    // provider.awareness.on('update', () => {
    //     console.log(provider.awareness.getStates());
    // })

    return store;
});

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = ThunkDispatch<RootState, undefined, AnyAction> & Dispatch<AnyAction>;