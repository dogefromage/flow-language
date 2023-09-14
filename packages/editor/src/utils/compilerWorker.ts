import * as lang from '@fluss/language';
import { ConsumerOutput } from '@fluss/shared';
import { expose } from 'comlink';

function validateCompileInterpret(document: lang.FlowDocument): ConsumerOutput {
    const context = lang.validateDocument(document);
    try {
        const program = lang.compileDocument(context);
        const sm = new lang.StackMachine();
        sm.interpret(program);
        return {
            data: sm.dpop()!.toString() + '\n',
        }
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