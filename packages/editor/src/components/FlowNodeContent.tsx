import * as lang from '@fluss/language';
import React from 'react';
import { FlowNodeNameWrapper, FlowNodeRowNameP } from '../styles/flowStyles';
import { FlowInputRowSwitch, FlowOutputRowSwitch } from './FlowNodeRowComponents';

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

    let inputType: lang.TupleTypeSpecifier | undefined;
    if (typeof context.specifier?.parameter !== 'string' && context.specifier?.parameter.type === 'tuple') {
        inputType = context.specifier.parameter;
    }
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