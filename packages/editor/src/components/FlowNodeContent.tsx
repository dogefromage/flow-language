import * as lang from '@fluss/language';
import React from 'react';
import { FlowNodeNameWrapper, FlowNodeRowNameP } from '../styles/flowStyles';
import { FlowInputRowSwitch, FlowOutputRowSwitch } from './FlowNodeRowComponents';
import { formatFlowLabel } from '../utils/flows';
import { FlowNodeErrorWrapper, FlowNodeRowErrorWrapper } from './FlowNodeErrorWrapper';
import { FlowNodeHeaderToolTip } from './FlowNodeToolTips';

interface Props {
    panelId: string;
    flowId: string;
    context: lang.FlowNodeContext;
    signature: lang.FlowSignature;
    env: lang.FlowEnvironment;
}

const FlowNodeContent = (props: Props) => {
    const { panelId, flowId, context, signature, env } = props;
    const commonProps = { panelId, flowId, nodeId: context.ref.id };

    let inputType: lang.TupleTypeSpecifier | undefined;
    if (typeof context.inferredType?.parameter !== 'string' && context.inferredType?.parameter.type === 'tuple') {
        inputType = context.inferredType.parameter;
    }
    const outputType = context.inferredType?.output;

    return (<>
        <FlowNodeNameWrapper $backColor={signature.attributes.color}>
            <FlowNodeErrorWrapper
                hasErrors={!!context.problems.length}
                tooltip={<FlowNodeHeaderToolTip env={env} context={context} signature={signature} />}
            >
                <FlowNodeRowNameP $align='left' $bold={true}>
                    {formatFlowLabel(signature.id)}
                </FlowNodeRowNameP>
            </FlowNodeErrorWrapper>
        </FlowNodeNameWrapper>
        <FlowOutputRowSwitch
            {...commonProps}
            key={signature.output.id}
            row={signature.output}
            type={outputType || lang.createAnyType()}
            context={context.outputRow}
            env={env}
        />
        {
            signature.inputs.map((input, index) =>
                <FlowInputRowSwitch
                    {...commonProps}
                    key={input.id}
                    row={input}
                    type={inputType?.elements[index] || lang.createAnyType()}
                    context={context.inputRows[input.id]}
                    env={env}
                />
            )
        }
    </>);
}

export default FlowNodeContent;