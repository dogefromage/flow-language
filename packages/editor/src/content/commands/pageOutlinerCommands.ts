import { flowsRemove } from "../../slices/flowsSlice";
import { Command, ViewTypes } from "../../types";

export const pageOutlinerCommands: Command[] = [
    {
        scope: 'view',
        viewType: ViewTypes.PageOutliner,
        id: 'pageOutliner.deleteFlowEntry',
        name: 'Delete Flow',
        actionCreator({}, params) {
            const flowId = params.flowId || '';
            return flowsRemove({
                flowId,
                undo: { desc: `Removed flow named '${flowId}'.` },
            });
        },
    },
]
