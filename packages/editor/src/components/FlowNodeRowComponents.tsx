import * as lang from "@fluss/language";
import React from "react";
import { FlowNodeRowDiv, FlowNodeRowNameP } from "../styles/flowStyles";
import { formatFlowLabel } from "../utils/flows";
import FlowJoint from "./FlowJoint";
import { FlowNodeRowErrorWrapper } from "./FlowNodeErrorWrapper";
import { FlowNodeRowDestructurings } from "./FlowNodeRowDestructurings";
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
            return <FlowOutputRowDestructured {...props as RowComponentProps<lang.DestructuredOutputRowSignature>} />
        case 'simple':
            return <FlowOutputRowSimple {...props as RowComponentProps<lang.SimpleOutputRowSignature>} />
    }
    console.error(`Unknown display type '${props.context?.display}.`);
    return null;
}

export const FlowOutputRowSimple = (props: RowComponentProps<lang.SimpleOutputRowSignature>) => {
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

export const FlowOutputRowDestructured = (props: RowComponentProps<lang.DestructuredOutputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    const resolvedType = lang.tryResolveTypeAlias(type, env);

    const canDestructure =
        resolvedType != null &&
        (resolvedType.type === 'map' || resolvedType.type === 'tuple');

    if (!canDestructure) {
        return (
            <FlowNodeRowErrorWrapper {...props}>
                <FlowNodeRowDiv>
                    <FlowNodeRowNameP $align='right'>
                        {formatFlowLabel(row.id)}
                    </FlowNodeRowNameP>
                </FlowNodeRowDiv>
            </FlowNodeRowErrorWrapper>
        );
    }

    const typeEntries: Array<{
        elementType: lang.TypeSpecifier,
        accessor: string,
        label: string,
    }> = [];

    if (resolvedType.type === 'tuple') {
        for (let i = 0; i < resolvedType.elements.length; i++) {
            typeEntries.push({
                elementType: resolvedType.elements[i],
                accessor: i.toString(),
                label: `[${i}]`,
            })
        }
    } else {
        for (const [key, elementType] of Object.entries(resolvedType.elements)) {
            typeEntries.push({
                elementType,
                accessor: key,
                label: key
            });
        }
    }

    return (
        <FlowNodeRowErrorWrapper
            {...props}
        >
            <FlowNodeRowDiv>
                <FlowNodeRowNameP $align='right'>
                    {formatFlowLabel(row.id)}
                </FlowNodeRowNameP>
            </FlowNodeRowDiv>
            {
                typeEntries.map(entry =>
                    <FlowNodeRowDiv key={entry.label}>
                        <FlowJoint
                            panelId={panelId}
                            flowId={flowId}
                            type={entry.elementType}
                            location={{
                                direction: 'output',
                                nodeId,
                                accessor: entry.accessor,
                            }}
                            env={env}
                        />
                        <FlowNodeRowNameP $align='right'>
                            {formatFlowLabel(entry.label)}
                        </FlowNodeRowNameP>
                    </FlowNodeRowDiv>
                )
            }
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
            return <FlowNodeRowDestructurings {...props} />
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
                        // initializer: 'first',
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
