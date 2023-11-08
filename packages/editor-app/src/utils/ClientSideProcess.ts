import * as bc from "@noodles/bytecode";
import * as lang from "@noodles/language";
import { languageValidator } from "../config/languageConfig";
import { ProcessState, RuntimeProcess } from "../types/runtime";

export class ClientSideProcess extends RuntimeProcess {
    private state: ProcessState = 'uninitialized';
    private smRoutine!: bc.StackMachineCoroutine;

    getState(): ProcessState {
        return this.state;
    }
    
    init(
        document: lang.FlowDocument,
        compilerArgs: bc.ByteCompilerArgs,
        runtimeArgs: bc.StackMachineArgs,
    ) {
        // VALIDATE
        const context = languageValidator(document);
        // COMPILE
        const program = bc.compileDocument(context, compilerArgs);
        console.log(bc.byteProgramToString(program));
        
        this.state = 'waiting';
        const sm = new bc.StackMachine(program, runtimeArgs);
        this.smRoutine = sm.start();
    }

    resume() {
        lang.assertTruthy(this.state === 'waiting', 'Can only resume process when it is waiting.');

        const ioResponse = this.smRoutine.next();

        if (!ioResponse.done) {
            this.state = 'waiting';
            return ioResponse.value;
        }

        this.state = 'terminated';
        return;
    }
}