import * as lang from '@noodles/language';
import { ConsumerOutput } from '@noodles/shared';
import { expose } from 'comlink';

function validateCompileInterpret(document: lang.FlowDocument, config: lang.ByteCompilerConfig): ConsumerOutput {
    const context = lang.validateDocument(document);
    try {
        const program = lang.compileDocument(context, config);
        const sm = new lang.StackMachine(program, {
            // trace: true, 
            countExecutedInstructions: true,
            // recordMaximumStackHeights: true,
        });
        sm.interpret();
        const res = sm.dpop();
        // console.log(res);
        return {
            data: res.toString() + '\n',
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