import * as lang from '@noodles/language';
import { RowComponentProps } from './FlowNodeRowComponents';
import { FlowNodeRowErrorWrapper } from './FlowNodeErrorWrapper';
import { FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';
import React from 'react';
import FlowJoint from './FlowJoint';
import { bracketSymbol, formatFlowLabel } from '../utils/flows';

export const FlowInputRowDestructurings = (props: RowComponentProps<lang.InputRowSignature>) => {
    const resType = lang.tryResolveTypeAlias(props.type, props.env);

    switch (resType?.type) {
        case 'list':
            return <InputListDestructuring {...props} />;
        case 'tuple':
            return <InputTupleDestructuring {...props} />;
        // case 'map':
        //     return <MapDestructuring {...props} />;
    }

    console.error(`Could not find destructuring for type '${resType?.type}'.`);
    return null;
}

export const FlowOutputRowDestructurings = (props: RowComponentProps<lang.DestructuredOutputRowSignature>) => {
    const resType = lang.tryResolveTypeAlias(props.type, props.env);

    switch (resType?.type) {
        case 'tuple':
            return <OutputTupleDestructuring {...props} />;
        case 'map':
            return <OutputMapDestructuring {...props} />;
    }

    return (
        <FlowNodeRowErrorWrapper {...props}>
            <FlowNodeRowDiv>
                <FlowNodeRowNameP $align='right'>
                    {formatFlowLabel(props.row.id)}
                </FlowNodeRowNameP>
            </FlowNodeRowDiv>
        </FlowNodeRowErrorWrapper>
    );
}

const InputListDestructuring = (props: RowComponentProps<lang.InputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    const listType = lang.tryResolveTypeAlias(type, env) as lang.ListTypeSpecifier;
    // holey array of connections
    // always add hole for last additional
    const connections = lang.utils.objToArr(context?.ref?.connections || {});
    const originalLen = connections.length;
    connections.push(undefined);

    return (
        <FlowNodeRowErrorWrapper {...props}> {
            connections.map((conn, index) =>
                <FlowNodeRowDiv
                    key={[index, conn?.nodeId, conn?.accessor].join('-')}
                >
                    <FlowJoint
                        panelId={panelId}
                        flowId={flowId}
                        type={listType?.element || lang.createAnyType()}
                        additional={conn == null}
                        location={{
                            direction: 'input',
                            nodeId,
                            accessor: index.toString(),
                            rowId: row.id,
                            // initializer: 'list-like',
                        }}
                        env={env}
                    />
                    <FlowNodeRowNameP $align='left'> {
                        (index < connections.length - 1) ?
                            `${formatFlowLabel(row.id)}[${index}] ${bracketSymbol(index, originalLen, 'input', 'sharp')}` : ''
                    }
                    </FlowNodeRowNameP>
                </FlowNodeRowDiv>
            )
        }
        </FlowNodeRowErrorWrapper >
    );
}

const InputTupleDestructuring = (props: RowComponentProps<lang.InputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    const tupleType = lang.tryResolveTypeAlias(type, env) as lang.TupleTypeSpecifier;
    // holey array of connections
    const connections = lang.utils.objToArr(context?.ref?.connections || {});
    while (connections.length < tupleType.elements.length) {
        connections.push(undefined);
    }

    return (
        <FlowNodeRowErrorWrapper {...props}> {
            connections.map((conn, index) =>
                <FlowNodeRowDiv
                    key={[index, conn?.nodeId, conn?.accessor].join('-')}>
                    <FlowJoint
                        panelId={panelId}
                        flowId={flowId}
                        type={tupleType?.elements?.[index] || lang.createAnyType()}
                        additional={conn == null}
                        location={{
                            direction: 'input',
                            nodeId,
                            accessor: index.toString(),
                            rowId: row.id,
                        }}
                        env={env}
                    />
                    <FlowNodeRowNameP $align='left'> {
                        `${formatFlowLabel(row.id)}[${index}] ${bracketSymbol(index, connections.length, 'input', 'sharp')}`
                    }
                    </FlowNodeRowNameP>
                </FlowNodeRowDiv>
            )
        }
        </FlowNodeRowErrorWrapper >
    );
}

export const OutputTupleDestructuring = (props: RowComponentProps<lang.DestructuredOutputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;
    const resolvedType = lang.tryResolveTypeAlias(type, env);
    if (resolvedType?.type !== 'tuple') {
        return null;
    }
    return (
        <FlowNodeRowErrorWrapper {...props}> {
            resolvedType.elements.map((elementType, index) =>
                <FlowNodeRowDiv key={index.toString()}>
                    <FlowJoint
                        panelId={panelId}
                        flowId={flowId}
                        type={elementType}
                        location={{
                            direction: 'output',
                            nodeId,
                            accessor: index.toString(),
                        }}
                        env={env}
                    />
                    <FlowNodeRowNameP $align='right'> {
                        `${bracketSymbol(index, resolvedType.elements.length, 'output', 'sharp')
                        } ${formatFlowLabel(row.id)}[${index}]`
                    }
                    </FlowNodeRowNameP>
                </FlowNodeRowDiv>
            )
        }
        </FlowNodeRowErrorWrapper>
    );
}

export const OutputMapDestructuring = (props: RowComponentProps<lang.DestructuredOutputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;
    const resolvedType = lang.tryResolveTypeAlias(type, env);
    if (resolvedType?.type !== 'map') {
        return null;
    }
    const entries = Object.entries(resolvedType.elements);
    return (
        <FlowNodeRowErrorWrapper {...props}> {
            entries.map(([prop, elementType], index) =>
                <FlowNodeRowDiv key={prop}>
                    <FlowJoint
                        panelId={panelId}
                        flowId={flowId}
                        type={elementType}
                        location={{
                            direction: 'output',
                            nodeId,
                            accessor: prop,
                        }}
                        env={env}
                    />
                    <FlowNodeRowNameP $align='right'> {
                        `.${prop} ${bracketSymbol(index, entries.length, 'output', 'round')}`
                    }
                    </FlowNodeRowNameP>
                </FlowNodeRowDiv>
            )
        }
        </FlowNodeRowErrorWrapper>
    );
}
