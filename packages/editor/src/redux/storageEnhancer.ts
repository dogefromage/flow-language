import { AnyAction, PayloadAction, Reducer } from "@reduxjs/toolkit";

enum StorageActionTypes {
    Replace = 'storageEnhancer.replace',
}
type StorageEnhancerAction = 
    PayloadAction<{ project: any }, StorageActionTypes.Replace>


export const storageEnhancerReplace = (payload: StorageEnhancerAction['payload']): StorageEnhancerAction => ({ 
    type: StorageActionTypes.Replace, 
    payload,
});

export default function storageEnhancer<S, A extends AnyAction>
    (reducer: Reducer<S, A>): Reducer<S, A> {
    return (state, _action) => {
        
        const action: StorageEnhancerAction = _action as any;
        if (action.type === StorageActionTypes.Replace) {
            return action.payload.project;
        }

        return reducer(state, _action);
    }
}









// export default function storageEnhancer<S, A extends AnyAction>
//     (reducer: Reducer<S, A>, load: () => S | undefined, store: (s: S) => void): Reducer<S, A> {
//     return (state, action) => {
//         // load
//         state ||= load();
//         // store
//         const newState = reducer(state, action);
//         if (state && state !== newState) {
//             store(state);
//         }
//         return newState;
//     }
// }