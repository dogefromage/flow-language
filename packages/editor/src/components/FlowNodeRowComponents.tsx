import * as lang from "@fluss/language";
import React from "react";
import { FlowNodeRowDiv, FlowNodeRowNameP } from "../styles/flowStyles";
import FlowJoint from "./FlowJoint";
import FlowNodeRowContextWrapper from "./FlowNodeRow";
import FlowNodeRowInitializer from "./FlowNodeRowInitializer";

export type RowComponentProps<R extends lang.InputRowSignature | lang.OutputRowSignature> = {
    panelId: string;
    flowId: string;
    nodeId: string;
    row: R;
    context: lang.RowContext | undefined;
    type: lang.TypeSpecifier;
    env: lang.FlowEnvironment;
}

export const FlowOutputRow = (props: RowComponentProps<lang.OutputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    return (
        <FlowNodeRowContextWrapper
            context={context}
        >
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'output',
                        nodeId,
                        rowId: row.id,
                    }}
                    env={env}
                />
                <FlowNodeRowNameP
                    $align='right'
                >
                    {row.label}
                </FlowNodeRowNameP>
            </FlowNodeRowDiv>
        </FlowNodeRowContextWrapper>
    );
}

export const FlowInputRowSwitch = (props: RowComponentProps<lang.InputRowSignature>) => {
    switch (props.row.rowType) {
        case 'input-simple':
            return <FlowInputRowSimple {...props as RowComponentProps<lang.SimpleInputRowSignature>} />
        case 'input-variable':
            return <FlowInputRowVariable {...props as RowComponentProps<lang.VariableInputRowSignature>} />
        case 'input-list':
            return <FlowInputRowList {...props as RowComponentProps<lang.ListInputRowSignature>} />
        default:
            console.error(`unknown row type ${(props.row as any).rowType}`);
            return null;
    }
}

export const FlowInputRowSimple = (props: RowComponentProps<lang.SimpleInputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    return (
        <FlowNodeRowContextWrapper
            context={context}
        >
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'input',
                        nodeId,
                        jointIndex: 0,
                        rowId: row.id,
                    }}
                    env={env}
                />
                <FlowNodeRowNameP
                    $align='left'
                >
                    {row.label}
                </FlowNodeRowNameP>
            </FlowNodeRowDiv>
        </FlowNodeRowContextWrapper>
    );
}

export const FlowInputRowVariable = (props: RowComponentProps<lang.VariableInputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    return (
        <FlowNodeRowContextWrapper context={context}>
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'input',
                        nodeId,
                        jointIndex: 0,
                        rowId: row.id,
                    }}
                    env={env}
                />
                <FlowNodeRowInitializer
                    flowId={flowId}
                    nodeId={nodeId}
                    row={row}
                    context={context}
                    type={type}
                />
            </FlowNodeRowDiv>
        </FlowNodeRowContextWrapper >
    );
}

export const FlowInputRowList = (props: RowComponentProps<lang.ListInputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    const listType = lang.tryResolveTypeAlias(type, env) as lang.ListTypeSpecifier;
    const connections = context?.ref?.connections || [];

    return (
        <FlowNodeRowContextWrapper
            context={context}
        >
            {
                connections.map((conn, index) =>
                    <FlowNodeRowDiv
                        key={[index, conn.nodeId, conn.outputId].join(':')}
                    >
                        <FlowJoint
                            panelId={panelId}
                            flowId={flowId}
                            type={listType.element}
                            location={{
                                direction: 'input',
                                nodeId,
                                jointIndex: index,
                                rowId: row.id,
                            }}
                            env={env}
                        />
                        <FlowNodeRowNameP
                            $align='left'
                        >
                            {`${row.label} [${index}]`}
                        </FlowNodeRowNameP>
                    </FlowNodeRowDiv>
                )
            }
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={listType.element}
                    additional={true}
                    location={{
                        direction: 'input',
                        nodeId,
                        jointIndex: connections.length,
                        rowId: row.id,
                    }}
                    env={env}
                />
                {
                    connections.length == 0 ? (
                        <FlowNodeRowNameP
                            $align='left'
                        >
                            {row.label}
                        </FlowNodeRowNameP>
                    ) : <div />
                }
            </FlowNodeRowDiv>
        </FlowNodeRowContextWrapper>
    );
}

