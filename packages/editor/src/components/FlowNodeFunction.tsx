import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { useSelectSingleFlowNode } from '../slices/flowsSlice';
import { assert } from '../utils';
import { FlowNodeProps } from './FlowEditorContent';

const FlowNodeFunction = ({ panelId, flowId, nodeId }: FlowNodeProps) => {
    const dispatch = useAppDispatch();
    const node = useAppSelector(useSelectSingleFlowNode(flowId, nodeId));
    if (!node) return null;
    assert(node.kind === 'function');

    return null;
}

export default FlowNodeFunction;