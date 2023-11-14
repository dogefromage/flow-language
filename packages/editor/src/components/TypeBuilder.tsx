import * as lang from 'noodle-language';
import React, { PropsWithChildren, useMemo } from 'react';
import styled from 'styled-components';
import FormSelectOption from './FormSelectOption';
import { MaterialSymbol } from '../styles/icons';

const WrapperDiv = styled.div`
    width: 100%;
    padding: 8px;
    border-radius: var(--border-radius);
    outline: 1px solid var(--color-2);
`;


interface TypeBuilderProps {
    X: lang.TypeSpecifier;
    env?: lang.FlowEnvironment;
    generics: lang.TemplateParameter[];
    onChange?: (X: lang.TypeSpecifier) => void;
}

const TypeBuilder = ({ X, env, generics, onChange }: PropsWithChildren<TypeBuilderProps>) => {
    return (
        <WrapperDiv> {
            env && 
            <TypeTag
                X={X}
                env={env}
                generics={generics}
                onChange={onChange}
            />
        }
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

// const MIDDLE_ANGLE = '├';
// const BOTTOM_ANGLE = '└';

interface TypeTagProps {
    X: lang.TypeSpecifier;
    env: lang.FlowEnvironment;
    generics: lang.TemplateParameter[];
    onChange?: (X: lang.TypeSpecifier) => void;
}

const TypeTag = ({ X, env, generics, onChange }: PropsWithChildren<TypeTagProps>) => {

    const { nameMap, typeMap } = useMemo(() => {
        const typeMap: Record<string, lang.TypeSpecifier> = {
            'tuple': lang.createTupleType(),
            'list': lang.createListType(lang.createAnyType()),
            'map': lang.createMapType({}),
            'function': lang.createFunctionType(lang.createTupleType(), lang.createAnyType()),
        };
        const nameMap: Record<string, string> = {
            'tuple': 'Tuple<...>',
            'list': 'List<...>',
            'map': 'Map<...>',
            'function': 'Function<...>',
        };
        if (env) {
            const envContent = lang.collectTotalEnvironmentContent(env);
            for (const [alias, _] of Object.entries(envContent.types || {})) {
                const key = `alias.${alias}`;
                typeMap[key] = lang.createAliasType(alias);
                nameMap[key] = alias;
            }
        }
        if (generics) {
            for (const g of generics) {
                const key = `generic.${g.id}`;
                typeMap[key] = lang.createGenericType(g.id);
                nameMap[key] = g.id;
            }
        }
        return { typeMap, nameMap };
    }, [X, env, generics]);

    let currentOption: string = X.type;
    if (X.type === 'alias' || X.type === 'generic') {
        currentOption = `${X.type}.${X.alias}`;
    }

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
                        generics={generics}
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
                                    generics={generics}
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
                </>
            } {
                (typeof X === 'object' && X.type === 'function') && <>
                    <div className="sub">
                        <div className="boxur">
                            {/* {BOTTOM_ANGLE} */}
                        </div>
                        <TypeTag
                            X={X.parameter}
                            env={env}
                            generics={generics}
                            onChange={newParam =>
                                onChange?.(lang.createFunctionType(newParam, X.output))
                            }
                        />
                    </div>
                    <div className="sub">
                        <div className="boxur">
                            {/* {BOTTOM_ANGLE} */}
                        </div>
                        <TypeTag
                            X={X.output}
                            env={env}
                            generics={generics}
                            onChange={newOutput =>
                                onChange?.(lang.createFunctionType(X.parameter, newOutput))
                            }
                        />
                    </div>
                </>
            }
        </TypeDiv>
    );
}
