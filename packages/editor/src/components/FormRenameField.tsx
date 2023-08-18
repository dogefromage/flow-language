import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import MaterialSymbol from '../styles/MaterialSymbol';

const RenameFieldDiv = styled.div`

    /* height: 1.4rem; */
    height: calc(0.8 * var(--list-height));
    padding: 0 0.5rem;
    display: flex;
    /* gap: 0.5rem; */
    align-items: center;

    cursor: text;

    background-color: var(--color-2);
    border-radius: var(--border-radius);

    /* &:hover,
    &:has(form > input:focus) {
        font-style: italic;
    } */
    form {
        input {
            width: 100%;
            background-color: unset;
            border: none;
            outline: none;
            font-style: inherit;
        }
    }
`;

interface Props {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
    allowEmpty?: boolean;
}

const FormRenameField = ({ value, onChange, disabled, allowEmpty }: Props) => {

    const inputRef = useRef<HTMLInputElement>(null);

    const [localValue, setLocalValue] = useState('');

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const submit = () => {
        if (!allowEmpty && localValue.length == 0) {
            return;
        }
        onChange(localValue);
        inputRef.current?.blur();
    }

    return (
        <RenameFieldDiv
            onClick={() => {
                inputRef.current?.select();
            }}
        >
            <form onSubmit={e => {
                e.preventDefault();
                submit();
            }}>
                <input
                    type='text'
                    value={localValue}
                    onChange={e => {
                        setLocalValue((e.currentTarget as HTMLInputElement).value);
                    }}
                    ref={inputRef}
                    onBlur={submit}
                    size={localValue.length || 1}
                    disabled={disabled}
                />
            </form> 
            {/* {
                !disabled &&
                <MaterialSymbol $size={16}>edit</MaterialSymbol>
            } */}
        </RenameFieldDiv>
    );
}

export default FormRenameField;