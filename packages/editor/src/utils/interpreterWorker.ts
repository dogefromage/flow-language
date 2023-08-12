import * as lang from '@fluss/language';
import { ConsumerOutput } from '@fluss/shared';
import { expose } from 'comlink';

function validateAndInterpret(document: lang.FlowDocument, config: lang.InterpreterConfig): ConsumerOutput {
    const context = lang.validateDocument(document);
    try {
        const result = lang.interpretDocument(context, config);
        return {
            data: result.returnValue?.toString() + '\n',
        }
    } catch (e: any) {
        return {
            data: e.toString() + '\n',
            accent: 'error',
        };
        // if (e instanceof lang.InterpretationException) {
        //     return {
        //         data: e.toString() + '\n',
        //         accent: 'error',
        //     };
        // }
        // throw e;
    }
}

const worker = { validateAndInterpret }

export type InterpreterWorker = typeof worker;
expose(worker);