import { EditorExtension, createExtensionSelector, except, makeGlobalCommand, useAppDispatch, useAppSelector } from "@noodles/editor";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RuntimeInputSignal, RuntimeSliceState } from "../types/runtime";
import { ClientSideRuntime } from "../utils/ClientSideRuntime";

const extensionId = 'runtime';
export const runtimeRunCommand = `${extensionId}.run`;

export const runtimeExtension: EditorExtension = config => {
    config.stateReducers[extensionId] = runtimeSlice.reducer;

    config.commands[runtimeRunCommand] = makeGlobalCommand(
        runtimeRunCommand,
        'Run Document',
        ({  }, params) => {
            return runtimeEmitSignal({ signal: 'run' });
        },
        [ { ctrlKey: true, key: 'Enter' }],
    );


    config.managerComponents.push(RuntimeManager);
}

const initialState: RuntimeSliceState = {
    activeRuntime: new ClientSideRuntime(),
}
const runtimeSlice = createSlice({
    name: extensionId,
    initialState,
    reducers: {
        emitSignal: (s, a: PayloadAction<{ signal: RuntimeInputSignal }>) => {
            if (s.activeRuntime == null) {
                except(`No runtime found.`);
            }
            s.activeRuntime.signalInput(a.payload.signal);
        },
    },
    // extraReducers(builder) {
        
    // },
});

export const {
    emitSignal: runtimeEmitSignal,
} = runtimeSlice.actions;

export const selectRuntime = createExtensionSelector<RuntimeSliceState>(extensionId);

const RuntimeManager = () => {
    const dispatch = useAppDispatch();
    const runtime = useAppSelector(selectRuntime);

    // useEffect(() => {
    //     const handleStateChange = (nextState: RuntimeState) => {
    //         switch (nextState) {
    //             case 'idle':
    //                 setDisplayState('Idle');
    //                 return;
    //             case 'running':
    //                 setDisplayState('Running');
    //                 return;
    //             case 'debugging':
    //                 setDisplayState('Debugging');
    //                 return;
    //             case 'interrupted':
    //                 setDisplayState('Interrupted');
    //                 return;
    //         }
    //     }

    //     function handleOutput(output: ConsoleLine) {
    //         dispatch(consolePushLine({ line: output }));
    //     }

    //     runtime.on('state-changed', handleStateChange);
    //     runtime.on('output', handleOutput);
        
    //     runtime.init();

    //     handleStateChange(runtime.state);

    //     return () => {
    //         runtime.off('state-changed', handleStateChange);
    //         runtime.off('output', handleOutput);
    //     }
    // }, [runtime]);

    // const document = useAppSelector(selectDocument);
    // useEffect(() => {
    //     runtime.setDocument(document);
    // }, [document, runtime]);

    return null;
}
