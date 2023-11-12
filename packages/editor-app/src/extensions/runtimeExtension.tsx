import * as bc from '@noodles/bytecode';
import { EditorExtension, Menus, consolePushLine, createConsoleError, createConsoleWarn, createExtensionSelector, except, makeGlobalCommand, selectDocument, useAppDispatch, useAppSelector } from "@noodles/editor";
import { FlowDocument } from "@noodles/language";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Remote, wrap } from "comlink";
import { useEffect } from 'react';
import { RuntimeProcess, RuntimeSliceState } from "../types/runtime";

const extensionId = 'runtime';
export const runtimeRunCommand = `${extensionId}.run`;
export const runtimeKillCommand = `${extensionId}.kill`;

export const runtimeExtension: EditorExtension = config => {
    config.stateReducers[extensionId] = runtimeSlice.reducer;

    config.commands[runtimeRunCommand] = makeGlobalCommand(
        runtimeRunCommand,
        'Run Document',
        ({ appState }, params) => {
            const document = selectDocument(appState);
            const runtime = selectRuntime(appState);
            if (runtime.process != null) {
                return createConsoleWarn('A process is already running.');
            }
            return runtimeRunDocument({ document });
        },
        [{ ctrlKey: true, key: 'Enter' }],
    );

    config.commands[runtimeKillCommand] = makeGlobalCommand(
        runtimeKillCommand,
        'Kill Process',
        ({ appState }, params) => {
            return runtimeKillProcess();
        },
    );

    config.toolbar.inlineMenus.push([
        'Run',
        RunMenuContent,
    ]);

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
                except('Process already running.')
            }
            s.process = createNewRuntimeProcess();
        },
        killProcess: s => {
            s.process?.worker.terminate();
            s.process = null;
        }
    },
});

function createNewRuntimeProcess() {
    const filePath = new URL('../utils/runtimeWorker', import.meta.url);
    const worker = new Worker(filePath, { type: 'module' });
    return {
        remote: wrap<RuntimeProcess>(worker),
        worker
    };
}

export const {
    runDocument: runtimeRunDocument,
    killProcess: runtimeKillProcess,
} = runtimeSlice.actions;

export const selectRuntime = createExtensionSelector<RuntimeSliceState>(extensionId);

const RuntimeManager = () => {
    const dispatch = useAppDispatch();
    const document = useAppSelector(selectDocument);
    const runtime = useAppSelector(selectRuntime);

    const startProcess = async (process: Remote<RuntimeProcess>) => {

        const compilerArgs: bc.ByteCompilerArgs = {
            // skipValidation: true,
        }
        const runtimeArgs: bc.StackMachineArgs = {
            countExecutedInstructions: true,
            // recordMaximumStackHeights: true,
            // trace: true,
        }

        try {
            await process.init(document, compilerArgs, runtimeArgs);

            while (true) {
                const currState = await process.getState();
                if (currState === 'terminated') {
                    dispatch(runtimeKillProcess());
                    return;
                }

                // switch "context" to process and wait for it to stop
                const response = await process.resume();

                if (response != null) {
                    dispatch(consolePushLine({
                        line: {
                            text: response,
                        },
                    }));
                }

            }

        } catch (e: any) {
            console.error(e);
            dispatch(createConsoleError(e));
            dispatch(runtimeKillProcess());
            return;
        }

    }

    useEffect(() => {
        const process = runtime.process;
        if (!process) return;

        startProcess(process.remote);

    }, [runtime.process]);

    return null;
}

const RunMenuContent = () => {
    return (
        <>
            <Menus.Command commandId={runtimeRunCommand} />
            <Menus.Command commandId={runtimeKillCommand} />
        </>
    );
}