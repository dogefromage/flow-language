import * as lang from '@noodles/language';
import * as bc from '@noodles/bytecode';
import { ConsumerOutput } from '@noodles/shared';
import { expose } from 'comlink';

function validateCompileInterpret(document: lang.FlowDocument, config: bc.ByteCompilerConfig): ConsumerOutput {
    const context = lang.validateDocument(document);
    try {
        // COMPILE
        const program = bc.compileDocument(context, config);
        console.log(bc.byteProgramToString(program));

        // INTERPRET
        const sm = new bc.StackMachine(program, {
            // trace: true, 
            countExecutedInstructions: true,
            // recordMaximumStackHeights: true,
        });
        sm.interpret();

        // OUTPUT
        const res = sm.dpop();
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