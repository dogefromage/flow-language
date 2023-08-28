import * as lang from "@fluss/language";
import React, { useMemo } from "react";
import { FlowNodeRowDiv, FlowNodeRowNameP } from "../styles/flowStyles";
import FlowJoint from "./FlowJoint";
import FlowNodeRowContextWrapper from "./FlowNodeRow";
import FlowNodeRowInitializer from "./FlowNodeRowInitializer";
import FormSelectOption from "./FormSelectOption";
import { useAppDispatch } from "../redux/stateHooks";
import { flowsSetRowValue } from "../slices/flowsSlice";

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
    switch (props.row.rowType) {
        case 'output-simple':
            return <FlowOutputRowSimple {...props as RowComponentProps<lang.SimpleOutputRowSignature>} />
        case 'output-destructured':
            return <FlowOutputRowDestructured {...props as RowComponentProps<lang.DestructuredOutputRowSignature>} />
        case 'output-hidden':
            return null;
        default:
            console.error(`unknown row type ${(props.row as any).rowType}`);
            return null;
    }
}

export const FlowOutputRowSimple = (props: RowComponentProps<lang.SimpleOutputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    return (
        <FlowNodeRowContextWrapper
            {...props}
        >
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'output',
                        nodeId,
                        // no accessor
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

export const FlowOutputRowDestructured = (props: RowComponentProps<lang.DestructuredOutputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    const resolvedType = lang.tryResolveTypeAlias(type, env);

    const canDestructure =
        resolvedType != null &&
        (resolvedType.type === 'map' || resolvedType.type === 'tuple');

    if (!canDestructure) {
        return (
            <FlowNodeRowContextWrapper
                {...props}
            >

            </FlowNodeRowContextWrapper>
        );
    }

    type Entry = {
        accessor: string;

    }

    return (
        <FlowNodeRowContextWrapper
            {...props}
        >
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={type}
                    location={{
                        direction: 'output',
                        nodeId,
                        // no accessor
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
        case 'input-function':
            return <FlowInputRowFunction {...props as RowComponentProps<lang.ListInputRowSignature>} />
        default:
            console.error(`unknown row type ${(props.row as any).rowType}`);
            return null;
    }
}

export const FlowInputRowSimple = (props: RowComponentProps<lang.SimpleInputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    return (
        <FlowNodeRowContextWrapper {...props}>
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
        <FlowNodeRowContextWrapper {...props}>
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
        <FlowNodeRowContextWrapper {...props}>
            {
                connections.map((conn, index) =>
                    <FlowNodeRowDiv
                        key={[index, conn.nodeId, conn.accessor].join(':')}
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

export const FlowInputRowFunction = (props: RowComponentProps<lang.ListInputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;
    const dispatch = useAppDispatch();

    const signatures = useMemo(() => {
        const envContent = lang.collectTotalEnvironmentContent(env);
        return Object.fromEntries(
            Object.entries(envContent.signatures || {})
                .map(([_, signature]) => [signature.id, signature.name])
        )
    }, [env]);

    return (
        <FlowNodeRowContextWrapper {...props}>
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
                <FormSelectOption
                    value={context?.ref?.value || ''}
                    options={Object.keys(signatures)}
                    mapName={signatures}
                    onChange={newSignatureId => {
                        dispatch(flowsSetRowValue({
                            flowId, nodeId, rowId: row.id,
                            rowValue: newSignatureId,
                            undo: { desc: 'Updated function input value.' },
                        }));
                    }}
                />
            </FlowNodeRowDiv>
        </FlowNodeRowContextWrapper >
    );
}

