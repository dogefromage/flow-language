import { assertDef } from "noodle-language";
import { ByteProgram, MACHINE_ENTRY_LABEL } from "./types";


export class ByteCodeOptimizer {

    constructor(
        private program: ByteProgram,
    ) {}

    optimize() {
        this.optUnusedChunks();
    }

    optUnusedChunks() {
        // make BFS to find all used chunks

        const unseenChunks = new Set(this.program.chunks.keys());
        unseenChunks.delete(MACHINE_ENTRY_LABEL);
        const toCheck: string[] = [MACHINE_ENTRY_LABEL];

        while (toCheck.length > 0) {
            const chunkLabel = toCheck.shift()!;
            const chunk = assertDef(this.program.chunks.get(chunkLabel));

            for (const instr of chunk.instructions) {
                if (instr.type === 'data' &&
                    typeof (instr.data) === 'string' &&
                    unseenChunks.has(instr.data)) {
                    unseenChunks.delete(instr.data);
                    toCheck.push(instr.data);
                }
            }
        }

        // remove unused chunks
        for (const unseedId of unseenChunks) {
            this.program.chunks.delete(unseedId);
        }
    }
}