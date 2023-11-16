import { flowsRemove } from "../../slices/flowsSlice";
import { FLOW_OUTLINER_VIEW_TYPE, createCommandGroup, createViewCommandUnlabeled } from "../../types";

export const {
    commands: flowOutlinerCommandList,
    labels: {
        deleteFlowEntry: flowOutlinerDeleteFlowEntryCommand,
    }
} = createCommandGroup(
    'flowOutliner',
    {
        deleteFlowEntry: createViewCommandUnlabeled(
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
    }
);