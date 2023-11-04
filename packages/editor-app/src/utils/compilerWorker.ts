import * as lang from '@noodles/language';
import * as bc from '@noodles/bytecode';
import { expose } from 'comlink';
import { languageValidator } from '../config/languageConfig';
import { ConsoleLine } from '@noodles/editor';

function validateCompileInterpret(document: lang.FlowDocument, config: bc.ByteCompilerConfig): ConsoleLine {
    
    const context = languageValidator(document);
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
            text: res.toString() + '\n',
        };
    } catch (e: any) {
        console.error(e);
        return {
            text: e.toString() + '\n',
            accent: 'error',
        };
    }
}

const worker = { validateCompileInterpret }

export type CompilerWorker = typeof worker;
expose(worker);