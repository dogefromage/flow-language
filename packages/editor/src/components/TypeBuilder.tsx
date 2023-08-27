import * as lang from '@fluss/language';
import React, { useMemo } from 'react';
import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { getSpecifierLabel } from '../utils/typeFormatting';
import FormSelectOption from './FormSelectOption';
import SymbolButton from '../styles/SymbolButton';
import MaterialSymbol from '../styles/MaterialSymbol';


const getContextBaseTypes = (flowEnvironment?: lang.FlowEnvironment) => {
    const typeMap: Record<string, lang.TypeSpecifier> = {
        'empty.tuple': lang.createTupleType(),
        'empty.list': lang.createListType(lang.createAnyType()),
        'empty.map': lang.createMapType({}),
    };
    const nameMap: Record<string, string> = {
        'empty.tuple': 'Tuple<...>',
        'empty.list': 'List<...>',
        'empty.map': 'Map<...>',
    };

    if (flowEnvironment) {
        const envContent = lang.collectTotalEnvironmentContent(flowEnvironment);
        for (const [alias, _] of Object.entries(envContent.types || {})) {
            const key = `def.${alias}`;
            typeMap[key] = alias;
            nameMap[key] = alias;
        }
    }
    return { typeMap, nameMap };
}



const WrapperDiv = styled.div`
    width: 100%;
    padding: 8px;
    border-radius: var(--border-radius);
    outline: 1px solid var(--color-2);
`;


interface TypeBuilderProps {
    X: lang.TypeSpecifier;
    env?: lang.FlowEnvironment;
    onChange?: (X: lang.TypeSpecifier) => void;
}

const TypeBuilder = ({ X, env, onChange }: PropsWithChildren<TypeBuilderProps>) => {
    return (
        <WrapperDiv>
            <TypeTag
                X={X}
                env={env}
                onChange={onChange}
            />
        </WrapperDiv>
    );
}

export default TypeBuilder;


const TypeDiv = styled.div`
    display: flex;
    flex-direction: column;

    gap: 4px;

    .tag, .sub {
        /* height: var(--list-height); */
        display: flex;
        /* align-items: center; */
    }

    .sub {
        .boxur {
            width: var(--list-height);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 25px;
            transform: translateY(-2px);
            color: var(--color-text-secondary);
        }
    }
`;

const MIDDLE_ANGLE = '├';
const BOTTOM_ANGLE = '└'

interface TypeTagProps {
    X: lang.TypeSpecifier;
    env?: lang.FlowEnvironment;
    onChange?: (X: lang.TypeSpecifier) => void;
}

const TypeTag = ({ X, env, onChange }: PropsWithChildren<TypeTagProps>) => {

    const { nameMap, typeMap } = useMemo(() => {
        const typeMap: Record<string, lang.TypeSpecifier> = {
            'tuple': lang.createTupleType(),
            'list': lang.createListType(lang.createAnyType()),
            'map': lang.createMapType({}),
        };
        const nameMap: Record<string, string> = {
            'tuple': 'Tuple<...>',
            'list': 'List<...>',
            'map': 'Map<...>',
        };
        if (env) {
            const envContent = lang.collectTotalEnvironmentContent(env);
            for (const [alias, _] of Object.entries(envContent.types || {})) {
                const key = `alias.${alias}`;
                typeMap[key] = alias;
                nameMap[key] = alias;
            }
        }
        return { typeMap, nameMap };
    }, [X, env]);

    const currentOption = typeof X === 'string' ? `alias.${X}` : X.type;

    return (
        <TypeDiv>
            <div className="tag">
                <FormSelectOption
                    value={currentOption}
                    options={Object.keys(typeMap)}
                    mapName={nameMap}
                    onChange={newKey => {
                        const newType = typeMap[newKey];
                        if (!newType) {
                            return console.error(`Unknown typekey`);
                        }
                        onChange?.(newType);
                    }}
                    widthInline={true}
                />
            </div>
            {
                (typeof X === 'object' && X.type === 'list') &&
                <div className="sub">
                    <div className="boxur">
                        {/* {BOTTOM_ANGLE} */}
                    </div>
                    <TypeTag
                        X={X.element}
                        env={env}
                        onChange={newElementType => {
                            onChange?.(lang.createListType(newElementType))
                        }}
                    />
                </div>
            } {
                (typeof X === 'object' && X.type === 'tuple') && <>
                    {
                        X.elements.map((Xi, index) =>
                            <div className="sub" key={index}>
                                <div className="boxur">
                                    {/* {MIDDLE_ANGLE} */}
                                </div>
                                <TypeTag
                                    X={Xi}
                                    env={env}
                                    onChange={newXi => {
                                        onChange?.(lang.createTupleType(
                                            ...X.elements.slice(0, index),
                                            newXi,
                                            ...X.elements.slice(index + 1),
                                        ));
                                    }}
                                />
                                {/* <MaterialSymbol children={'remove'} $button onClick={() => {
                                    onChange?.(lang.createTupleType(
                                        ...X.elements.slice(0, index),
                                        ...X.elements.slice(index + 1),
                                    ));
                                }} /> */}
                            </div>
                        )
                    }
                    <div className="sub">
                        <div className="boxur">
                            {/* {BOTTOM_ANGLE} */}
                        </div>
                        <MaterialSymbol children={'add'} $button onClick={() => {
                            onChange?.(lang.createTupleType(...X.elements, lang.createAnyType()));
                        }} />
                    </div>
                </>}
        </TypeDiv>
    );
}
