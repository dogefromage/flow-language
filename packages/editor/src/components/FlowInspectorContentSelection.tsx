import { PropsWithChildren } from 'react';

interface FlowInspectorContentSelectionProps {
    panelId: string;
}

const FlowInspectorContentSelection = ({ panelId }: PropsWithChildren<FlowInspectorContentSelectionProps>) => {
    return null;
    
    // const dispatch = useAppDispatch();
    // const flowId = useAppSelector(selectEditor).activeFlow;
    // const flow = useAppSelector(useSelectSingleFlow(flowId!));
    // const selection = useAppSelector(useFlowEditorPanelState(panelId));


    // if (!flow || !flowId) return null;

    // return (
    //     {
    //         (flow && flowId) && (<>
                
    //             <FormExpandableRegion name='Active Element' defaultValue={true}>
    //                 <p>TODO</p>
    //             </FormExpandableRegion>
    //         </>)
    //     }
    // );
}

export default FlowInspectorContentSelection;