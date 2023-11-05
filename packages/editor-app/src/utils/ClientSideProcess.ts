import * as lang from "@noodles/language";
import * as bc from "@noodles/bytecode";
import { ProcessState, RuntimeCallback, RuntimeProcess } from "../types/runtime";
import { languageValidator } from "../config/languageConfig";

export class ClientSideProcess extends RuntimeProcess {
    private state: ProcessState = 'uninitialized';
    private machine!: bc.StackMachine;
    private callback!: RuntimeCallback;

    getState(): ProcessState {
        return this.state;
    }

    
    init(
        document: lang.FlowDocument,
        compilerArgs: bc.ByteCompilerArgs,
        runtimeArgs: bc.StackMachineArgs,
        callback: RuntimeCallback,
    ) {

        // VALIDATE
        const context = languageValidator(document);
        // COMPILE
        const program = bc.compileDocument(context, compilerArgs);
        console.log(bc.byteProgramToString(program));
        
        this.state = 'idle';
        this.callback = callback;
        this.machine = new bc.StackMachine(program, runtimeArgs);
    }

    run(): void {
        lang.assertTruthy(this.state !== 'uninitialized', 'Process must be initialized.');

        this.state = 'active';

        this.machine.interpret();

        this.callback

        yield this.machine.dpop().toString();

        this.state = 'halted';
    }
}