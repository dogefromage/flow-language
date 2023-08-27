import * as lang from '@fluss/language';
import React from 'react';
import { FlowNodeNameWrapper, FlowNodeRowNameP } from '../styles/flowStyles';
import { FlowInputRowSwitch, FlowOutputRow } from './FlowNodeRowComponents';

interface Props {
    panelId: string;
    flowId: string;
    context: lang.FlowNodeContext;
    signature: lang.FlowSignature;
    env: lang.FlowEnvironment;
}

const FlowNodeContent = ({ panelId, flowId, context, signature, env }: Props) => {
    const commonProps = {
        panelId,
        flowId,
        nodeId: context.ref.id,
    };
    const inputType = context.specifier?.parameter;
    const outputType = context.specifier?.output;

    return (<>
        <FlowNodeNameWrapper
            $backColor={signature.attributes.color}
        >
            <FlowNodeRowNameP
                $align='left'
                $bold={true}
            // $color={'black'}
            >
                {signature.name}
            </FlowNodeRowNameP>
        </FlowNodeNameWrapper>
        {
            signature.outputs.map(output =>
                <FlowOutputRow
                    {...commonProps}
                    key={output.id}
                    row={output}
                    type={outputType?.elements[output.id] || lang.createAnyType()}
                    context={context.outputRows[output.id]}
                    env={env}
                />
            )
        }
        {
            signature.inputs.map(input =>
                <FlowInputRowSwitch
                    {...commonProps}
                    key={input.id}
                    row={input}
                    type={inputType?.elements[input.id] || lang.createAnyType()}
                    context={context.inputRows[input.id]}
                    env={env}
                />
            )
        }
    </>);
}

export default FlowNodeContent;