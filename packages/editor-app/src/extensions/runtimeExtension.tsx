import { EditorExtension, createExtensionSelector, makeGlobalCommand, selectDocument, useAppDispatch, useAppSelector } from "@noodles/editor";
import { FlowDocument } from "@noodles/language";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Remote, wrap } from "comlink";
import { RuntimeProcess, RuntimeSliceState } from "../types/runtime";
import * as bc from '@noodles/bytecode';
import { useEffect } from "react";

const extensionId = 'runtime';
export const runtimeRunCommand = `${extensionId}.run`;

export const runtimeExtension: EditorExtension = config => {
    config.stateReducers[extensionId] = runtimeSlice.reducer;

    config.commands[runtimeRunCommand] = makeGlobalCommand(
        runtimeRunCommand,
        'Run Document',
        ({ appState }, params) => {
            const document = selectDocument(appState);
            return runtimeRunDocument({ document });
        },
        [ { ctrlKey: true, key: 'Enter' }],
    );

    config.managerComponents.push(RuntimeManager);
}

const initialState: RuntimeSliceState = {
    process: null,
}

const runtimeSlice = createSlice({
    name: extensionId,
    initialState,
    reducers: {
        runDocument: (s, a: PayloadAction<{ document: FlowDocument }>) => {
            if (s.process != null) {
                console.warn(`Did not create process, already there`);
                return;
            }

            const compilerArgs: bc.ByteCompilerArgs = {
                // skipValidation: true,
            }
            const runtimeArgs: bc.StackMachineArgs = {
                countExecutedInstructions: true,
                // recordMaximumStackHeights: true,
                // trace: true,
            }

            const process = createNewRuntimeProcess();
            
            process.init(a.payload.document, compilerArgs, runtimeArgs);
            s.process = process;
        },
    },
    // extraReducers(builder) {
        
    // },
});

function createNewRuntimeProcess() {
    const worker = new Worker(new URL('../utils/runtimeWorker.js', import.meta.url), { type: 'module' });
    return wrap<RuntimeProcess>(worker);
}

export const {
    runDocument: runtimeRunDocument,
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
