import * as lang from "noodle-language";
import React from "react";
import { FlowNodeRowDiv, FlowNodeRowNameP } from "../styles/flowStyles";
import { formatFlowLabel } from "../utils/flows";
import FlowJoint from "./FlowJoint";
import { FlowNodeRowErrorWrapper } from "./FlowNodeErrorWrapper";
import { FlowInputRowDestructurings, FlowOutputRowDestructurings } from "./FlowNodeRowDestructurings";
import { FlowNodeRowInitializers } from "./FlowNodeRowInitializers";

type RowSignature = lang.InputRowSignature | lang.OutputRowSignature;
export type RowComponentProps<R extends RowSignature = RowSignature> = {
    panelId: string;
    flowId: string;
    nodeId: string;
    row: R;
    context: lang.RowContext | undefined;
    type: lang.TypeSpecifier;
    env: lang.FlowEnvironment;
}

export const FlowOutputRowSwitch = (props: RowComponentProps<lang.OutputRowSignature>) => {
    switch (props.context?.display) {
        case 'hidden':
            return null;
        case 'destructured':
            return <FlowOutputRowDestructurings {...props as RowComponentProps<lang.OutputRowSignature>} />
        case 'simple':
            return <FlowOutputRowSimple {...props as RowComponentProps<lang.OutputRowSignature>} />
    }
    console.error(`Unknown display type '${props.context?.display}.`);
    return null;
}

export const FlowOutputRowSimple = (props: RowComponentProps<lang.OutputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    return (
        <FlowNodeRowErrorWrapper {...props}>
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'output',
                        nodeId,
                    }}
                    env={env}
                />
                <FlowNodeRowNameP $align='right'>
                    {formatFlowLabel(row.id)}
                </FlowNodeRowNameP>
            </FlowNodeRowDiv>
        </FlowNodeRowErrorWrapper>
    );
}

export const FlowInputRowSwitch = (props: RowComponentProps<lang.InputRowSignature>) => {
    switch (props.context?.display) {
        case 'simple':
            return <FlowInputRowSimple {...props} />
        case 'initializer':
            return <FlowNodeRowInitializers {...props} />
        case 'destructured':
            return <FlowInputRowDestructurings {...props} />
        case 'hidden':
            return null;
    }
    console.error(`Unknown display type '${props.context?.display}.`);
    return null;
}

export const FlowInputRowSimple = (props: RowComponentProps<lang.InputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    return (
        <FlowNodeRowErrorWrapper {...props}>
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'input',
                        nodeId,
                        rowId: row.id,
                        accessor: '0',
                    }}
                    env={env}
                />
                <FlowNodeRowNameP $align='left'>
                    {formatFlowLabel(row.id)}
                </FlowNodeRowNameP>
            </FlowNodeRowDiv>
        </FlowNodeRowErrorWrapper>
    );
}
