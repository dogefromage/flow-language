import * as lang from '@fluss/language';
import { RowComponentProps } from './FlowNodeRowComponents';
import { FlowNodeRowErrorWrapper } from './FlowNodeErrorWrapper';
import { FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';
import React from 'react';
import FlowJoint from './FlowJoint';
import { formatFlowLabel } from '../utils/flows';

export const FlowNodeRowDestructurings = (props: RowComponentProps<lang.InputRowSignature>) => {
    const resType = lang.tryResolveTypeAlias(props.type, props.env);

    switch (resType?.type) {
        case 'list':
            return <ListDestructuring {...props} />;
        case 'tuple':
            return <TupleDestructuring {...props} />;
        // case 'map':
        //     return <MapDestructuring {...props} />;
    }

    console.error(`Could not find destructuring for type '${resType?.type}'.`);
    return null;
}

const ListDestructuring = (props: RowComponentProps<lang.InputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;

    const listType = lang.tryResolveTypeAlias(type, env) as lang.ListTypeSpecifier;
    // holey array of connections
    // always add hole for last additional
    const connections = lang.utils.objToArr(context?.ref?.connections || {});
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
                            initializer: 'list-like',
                        }}
                        env={env}
                    />
                    <FlowNodeRowNameP $align='left'> {
                        (index < connections.length - 1) ?
                            `${formatFlowLabel(row.id)}[${index}]` : ''
                    }
                    </FlowNodeRowNameP>
                </FlowNodeRowDiv>
            )
        }
        </FlowNodeRowErrorWrapper >
    );
}

const TupleDestructuring = (props: RowComponentProps<lang.InputRowSignature>) => {
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
                    key={[index, conn?.nodeId, conn?.accessor].join('-')}
                >
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
                            initializer: 'list-like',
                        }}
                        env={env}
                    />
                    <FlowNodeRowNameP $align='left'> {
                        `${formatFlowLabel(row.id)}[${index}]`
                    }
                    </FlowNodeRowNameP>
                </FlowNodeRowDiv>
            )
        }
        </FlowNodeRowErrorWrapper >
    );
}
