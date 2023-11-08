import * as bc from "@noodles/bytecode";
import * as lang from "@noodles/language";
import { Remote } from "comlink";
import Emittery from "emittery";

// export type RuntimeState = 'idle'| 'running'| 'debugging'| 'interrupted'
// export type RuntimeInputSignal = 'run' | 'force-run' | 'debug' | 'restart-debug' | 'abort';

// export abstract class DocumentRuntime extends Emittery<{
//     'state-changed': RuntimeState,
//     'output': ConsoleLine,
// }> {
//     abstract get state(): RuntimeState;

//     abstract setDocument(document: lang.FlowDocument): void;
//     abstract signalInput(input: RuntimeInputSignal): void;
//     abstract init(): void;
// }

export interface RuntimeSliceState {
    process: {
        remote: Remote<RuntimeProcess>;
        worker: Worker;
    } | null;
}

export type ProcessState = 'uninitialized' | 'waiting' | 'terminated';
export type RuntimeCallback = (msg: string) => void;

export abstract class RuntimeProcess {

    abstract init(
        document: lang.FlowDocument, compilerArgs: bc.ByteCompilerArgs, runtimeArgs: bc.StackMachineArgs,
    ): void;

    abstract getState(): ProcessState;

    abstract resume(): string | undefined;
}