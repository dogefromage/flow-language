import * as lang from "@fluss/language";
import React from "react";
import { FlowNodeRowNameP } from "../styles/flowStyles";
import { Vec2 } from "../types";
import FlowJoint from "./FlowJoint";
import FlowNodeRow from "./FlowNodeRow";
import FlowNodeRowInitializer from "./FlowNodeRowInitializer";

export type RowComponentProps<R extends lang.InputRowSignature | lang.OutputRowSignature> = {
    panelId: string;
    flowId: string;
    nodeId: string;
    row: R;
    context: lang.RowContext | undefined;
    type: lang.TypeSpecifier;
    env: lang.FlowEnvironment;
    getClientNodePos: () => Vec2;
}

export const FlowOutputRow = (props: RowComponentProps<lang.OutputRowSignature>) => {
    const { panelId, flowId, nodeId, row, getClientNodePos, context, type, env } = props;

    return (
        <FlowNodeRow
            context={context}
        >
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
                getClientNodePos={getClientNodePos}
            />
            <FlowNodeRowNameP
                $align='right'
            >
                {row.label}
            </FlowNodeRowNameP>
        </FlowNodeRow>
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
    const { panelId, flowId, nodeId, row, getClientNodePos, context, type, env } = props;

    return (
        <FlowNodeRow
            context={context}
        >
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
                getClientNodePos={getClientNodePos}
            />
            <FlowNodeRowNameP
                $align='left'
            >
                {row.label}
            </FlowNodeRowNameP>
        </FlowNodeRow>
    );
}

export const FlowInputRowVariable = (props: RowComponentProps<lang.VariableInputRowSignature>) => {
    const { panelId, flowId, nodeId, row, getClientNodePos, context, type, env } = props;

    return (
        <FlowNodeRow context={context}>
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
                getClientNodePos={getClientNodePos}
            />
            <FlowNodeRowInitializer
                flowId={flowId}
                nodeId={nodeId}
                row={row}
                context={context}
                type={type}
            />
        </FlowNodeRow >
    );
}

export const FlowInputRowList = (props: RowComponentProps<lang.ListInputRowSignature>) => {
    const { panelId, flowId, nodeId, row, getClientNodePos, context } = props;

    return (
        <FlowNodeRow context={context}>
            {/* <FlowJoint
                panelId={panelId}
                flowId={flowId}
                dataType={row.dataType}
                location={{
                    direction: 'input',
                    nodeId,
                    jointIndex: 0,
                    rowId: row.id,
                }}
                getClientNodePos={getClientNodePos}
            /> */}
            <FlowNodeRowNameP
                $align='left'
            >
                {row.label}
            </FlowNodeRowNameP>
        </FlowNodeRow>
    );
}

