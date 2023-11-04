import { ConsoleLine } from "@noodles/editor";
import * as lang from "@noodles/language";
import Emittery from 'emittery';

export type RuntimeState = 'idle'| 'running'| 'debugging'| 'interrupted'
export type RuntimeInputSignal = 'run' | 'force-run' | 'debug' | 'restart-debug' | 'abort';

export abstract class DocumentRuntime extends Emittery<{
    'state-changed': RuntimeState,
    'output': ConsoleLine,
}> {
    abstract get state(): RuntimeState;

    abstract setDocument(document: lang.FlowDocument): void;
    abstract signalInput(input: RuntimeInputSignal): void;
    abstract init(): void;
}

export interface RuntimeSliceState {
    activeRuntime: DocumentRuntime | null;
}