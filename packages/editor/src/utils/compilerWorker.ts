import * as lang from '@fluss/language';
import { ConsumerOutput } from '@fluss/shared';
import { expose } from 'comlink';

function validateCompileInterpret(document: lang.FlowDocument, config: lang.ByteCompilerConfig): ConsumerOutput {
    const context = lang.validateDocument(document);
    try {
        const program = lang.compileDocument(context, config);
        const sm = new lang.StackMachine(program);
        sm.interpret('global:document:main');
        const result = sm.dpop() as lang.ConcreteValue;
        return {
            data: result.value.toString() + '\n',
        };
    } catch (e: any) {
        console.error(e);
        return {
            data: e.toString() + '\n',
            accent: 'error',
        };
    }
}

const worker = { validateCompileInterpret }

export type CompilerWorker = typeof worker;
expose(worker);