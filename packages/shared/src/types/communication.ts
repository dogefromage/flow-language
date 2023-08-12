import * as lang from "@fluss/language";
import Emittery from 'emittery';

export type ConsumerStateIdle = {
    type: 'idle';
};
export type ConsumerStateRunning = {
    type: 'running';
};
export type ConsumerStateDebugging = {
    type: 'debugging';
};
export type ConsumerStateInterrupted = {
    type: 'interrupted';
};

export type ConsumerState =
    | ConsumerStateIdle
    | ConsumerStateRunning
    | ConsumerStateDebugging
    | ConsumerStateInterrupted

export type ConsumerInputSignal = 'run' | 'force-run' | 'debug' | 'restart-debug' | 'abort'; // add more

export interface ConsumerOutput {
    data: string;
    accent?: 'error' | 'warn';
}

export abstract class DocumentConsumer extends Emittery<{
    'state-changed': ConsumerState,
    'output': ConsumerOutput,
}> {
    abstract get state(): ConsumerState;

    abstract setDocument(document: lang.FlowDocument): void;
    abstract signalInput(input: ConsumerInputSignal): void;
}