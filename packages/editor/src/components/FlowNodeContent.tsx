import React from 'react';
import { FlowNodeNameWrapper, FlowNodeRowNameP } from '../styles/flowStyles';
import { Vec2 } from '../types';
import { FlowInputRowSwitch, FlowOutputRow } from './FlowNodeRowComponents';
import * as lang from '@fluss/language';

interface Props {
    panelId: string;
    flowId: string;
    context: lang.FlowNodeContext;
    signature: lang.FlowSignature;
    getClientNodePos: () => Vec2;
    env: lang.FlowEnvironment;
}

const FlowNodeContent = ({ panelId, flowId, context, signature, getClientNodePos, env }: Props) => {
    const commonProps = { 
        panelId, 
        flowId, 
        nodeId: context.ref.id, 
        getClientNodePos 
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
                    type={outputType?.elements[output.id] || lang.createUnknownType()}
                    context={context.rowContexts[output.id]}
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
                    type={inputType?.elements[input.id] || lang.createUnknownType()}
                    context={context.rowContexts[input.id]}
                    env={env}
                />
            )
        }
    </>);
}

export default FlowNodeContent;