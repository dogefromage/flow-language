import * as lang from '@noodles/language';
import { wrap } from 'comlink';
import { DocumentRuntime } from '../types/runtime';

export class ClientSideRuntime extends DocumentRuntime {

    private document: lang.FlowDocument | null = null;

    get state(): State {
        return this._state;
    }

    private updateState(next: State) {
        this._state = next;
        this.emit('state-changed', next);
    }

    init(): void {
        // this.emit('output', { text: 'ClientSideRuntime:\n' });
    }

    setDocument(document: lang.FlowDocument): void {
        this.document = document;
    }

    signalInput(input: ConsumerInputSignal): void {
        switch (input) {
            case 'run':
                this.execute();
                return;
            case 'force-run':
                this.execute(true);
                return;
            case 'abort':
                this.abort();
                return;
        }
        throw new Error(`Input signal not implemented '${input}'`);
    }

    private async execute(forceRun = false) {
        if (!this.document) {
            return console.error(`No document set.`);
        }

        if (this.state.type != 'idle') {
            return;
        }

        const worker = new Worker(
            new URL('./compilerWorker.js', import.meta.url),
            { type: 'module' },
        );
        this.updateState({ type: 'running', worker });

        const { validateCompileInterpret } = wrap<import('@noodles/editor/src/utils/compilerWorker').CompilerWorker>(worker);
        try {
            const result = await validateCompileInterpret(this.document, {
                skipValidation: forceRun,
            });
            this.emit('output', result);
        }
        finally {
            this.updateState({ type: 'idle' });
        }
    }

    private abort() {
        const worker: Worker = (this.state as any).worker;
        if (worker == null) {
            return;
        }
        worker?.terminate();
        this.emit('output', { text: 'Program aborted.\n' });
        this.updateState({ type: 'idle' });
    }
}