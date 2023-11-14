import { flowsRemove } from "../../slices/flowsSlice";
import { Command, FLOW_OUTLINER_VIEW_TYPE, createViewCommand } from "../../types";

export const flowOutlinerCommands: Command[] = [
    createViewCommand(
        'flowOutliner.deleteFlowEntry',
        FLOW_OUTLINER_VIEW_TYPE,
        'Delete Flow',
        ({}, params) => {
            const flowId = params.flowId || '';
            return flowsRemove({
                flowId,
                undo: { desc: `Removed flow named '${flowId}'.` },
            });
        }
    ),
]
