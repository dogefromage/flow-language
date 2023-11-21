import _ from 'lodash';
import * as lang from 'noodle-language';
import { useAppDispatch } from '../redux/stateHooks';
import { flowsRenameConnectionAccessor } from '../slices/flowsSlice';
import { FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';
import { bracketSymbol, dictionaryRegex, formatFlowLabel } from '../utils/flows';
import FlowJoint from './FlowJoint';
import { FlowNodeRowErrorWrapper } from './FlowNodeErrorWrapper';
import { RowComponentProps } from './FlowNodeRowComponents';
import FormRenameField from './FormRenameField';

export const FlowInputRowDestructurings = (props: RowComponentProps<lang.InputRowSignature>) => {
    const resType = lang.tryResolveTypeAlias(props.type, props.env);

    switch (resType?.type) {
        case 'list':
            return <InputListDestructuring {...props} />;
        case 'tuple':
            return <InputTupleDestructuring {...props} />;
        case 'map':
            return <InputMapDestructuring {...props} />;
    }

    console.error(`Could not find destructuring for type '${resType?.type}'.`);
    return null;
}

export const FlowOutputRowDestructurings = (props: RowComponentProps<lang.OutputRowSignature>) => {
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
    const args = lang.utils.objToArr(context?.ref?.rowArguments || {});
    const originalLen = args.length;
    args.push(undefined);

    return (
        <FlowNodeRowErrorWrapper {...props}> {
            args.map((arg, index) =>
                <FlowNodeRowDiv key={index}>
                    <FlowJoint
                        panelId={panelId}
                        flowId={flowId}
                        type={listType?.element || lang.createAnyType()}
                        additional={arg == null}
                        location={{
                            direction: 'input',
                            nodeId,
                            accessor: index.toString(),
                            rowId: row.id,
                        }}
                        env={env}
                    />
                    <FlowNodeRowNameP $align='left'> {
                        (index < args.length - 1) ?
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
    const args = lang.utils.objToArr(context?.ref?.rowArguments || {});
    while (args.length < tupleType.elements.length) {
        args.push(undefined);
    }

    return (
        <FlowNodeRowErrorWrapper {...props}> {
            args.map((arg, index) =>
                <FlowNodeRowDiv key={index}>
                    <FlowJoint
                        panelId={panelId}
                        flowId={flowId}
                        type={tupleType?.elements?.[index] || lang.createAnyType()}
                        additional={arg == null}
                        location={{
                            direction: 'input',
                            nodeId,
                            accessor: index.toString(),
                            rowId: row.id,
                        }}
                        env={env}
                    />
                    <FlowNodeRowNameP $align='left'> {
                        `${formatFlowLabel(row.id)}[${index}] ${bracketSymbol(index, args.length, 'input', 'sharp')}`
                    }
                    </FlowNodeRowNameP>
                </FlowNodeRowDiv>
            )
        }
        </FlowNodeRowErrorWrapper >
    );
}

const InputMapDestructuring = (props: RowComponentProps<lang.InputRowSignature>) => {
    const { panelId, flowId, nodeId, row, context, type, env } = props;
    const dispatch = useAppDispatch();

    const mapType = lang.tryResolveTypeAlias(type, env) as lang.MapTypeSpecifier;

    const emptyKeys = _.mapValues(mapType.elements, x => undefined);
    const args = {
        ...emptyKeys,
        ...context?.ref?.rowArguments,
    };

    const numArgs = Object.keys(args).length;
    const additionalKey = `key_${numArgs}`;

    return (
        <FlowNodeRowErrorWrapper {...props}> {
            Object.entries(args).map(([dictionaryKey, arg]) => {

                const inputLocation: lang.JointLocation = {
                    direction: 'input',
                    nodeId,
                    accessor: dictionaryKey,
                    rowId: row.id,
                };

                return (
                    <FlowNodeRowDiv key={dictionaryKey}>
                        <FlowJoint
                            panelId={panelId}
                            flowId={flowId}
                            type={mapType?.elements?.[dictionaryKey] || lang.createAnyType()}
                            additional={arg == null}
                            location={inputLocation}
                            env={env}
                        />
                        <FormRenameField
                            nodeRowHeight
                            value={dictionaryKey}
                            onValidate={newValue => {
                                if (newValue.length == 0) {
                                    return { message: 'Please provide a key.' };
                                }
                                if (!dictionaryRegex.test(newValue)) {
                                    return { message: 'Please provide a valid key. A key should only contain letters, digits, underscores and should not start with a number. Example: "add_5"' };
                                }
                                if (args[newValue] != null && newValue != dictionaryKey) {
                                    return { message: `Duplicate key '${newValue}'.` };
                                }
                                return undefined;
                            }}
                            onChange={newDictionaryKey => {
                                dispatch(flowsRenameConnectionAccessor({
                                    flowId,
                                    input: inputLocation,
                                    newAccessor: newDictionaryKey,
                                    undo: { desc: 'Renamed map input accessor on node.' },
                                }))
                            }}
                        />
                    </FlowNodeRowDiv>
                )
            }
            )
        }
            <FlowNodeRowDiv>
                <FlowJoint
                    panelId={panelId}
                    flowId={flowId}
                    type={lang.createAnyType()}
                    additional={true}
                    location={{
                        direction: 'input',
                        nodeId,
                        accessor: additionalKey,
                        rowId: row.id,
                    }}
                    env={env}
                />
                <FlowNodeRowNameP $align='left' />
            </FlowNodeRowDiv>

        </FlowNodeRowErrorWrapper >
    );
}

export const OutputTupleDestructuring = (props: RowComponentProps<lang.OutputRowSignature>) => {
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

export const OutputMapDestructuring = (props: RowComponentProps<lang.OutputRowSignature>) => {
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
