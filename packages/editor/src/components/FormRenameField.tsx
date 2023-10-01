import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const RelativeWrapper = styled.div`
    width: 100%;
    position: relative;
`

const RenameFieldDiv = styled.div`
    form {
        input {
            width: 100%;
            height: calc(0.8 * var(--list-height));

            background-color: unset;
            border: none;
            outline: none;
            font-style: inherit;
            
            padding: 0 0.5rem;
            display: flex;
            align-items: center;

            background-color: var(--color-2);
            border-radius: var(--border-radius);
            cursor: text;
            
            &:focus {
                outline: 1px solid white;
            }

            &:disabled {
                cursor: not-allowed;
            }
        }
    }

`;

const RenameFieldError = styled.div`
    position: absolute;
    z-index: 1;
    min-width: 200px;
    width: 100%;
    top: calc(var(--list-gap) + 100%);
    background-color: #460000;
    outline: 1px solid red;
    padding: 0 0.5rem;
`;

export interface NameValidationError {
    message: string;
}

interface Props {
    value: string;
    onChange?: (newValue: string) => void;
    onBlur?: () => void;
    onValidate?: (newValue: string) => NameValidationError | undefined;
    disabled?: boolean;
    autofocus?: boolean;
}

const FormRenameField = ({ value: initialValue, onChange, onValidate, disabled, autofocus, onBlur }: Props) => {

    const inputRef = useRef<HTMLInputElement>(null);

    const [localValue, setLocalValue] = useState('');
    const [validationError, setValidationError] = useState<NameValidationError>();
    const [ active, setActive ] = useState(false);

    // initial or external change in value
    useEffect(() => {
        updateInternally(initialValue || '');
    }, [initialValue]);

    function updateInternally(rawVal: string) {
        const newVal = rawVal.trimStart();
        setLocalValue(newVal);
        setValidationError(onValidate?.(newVal));
    }

    const submit = () => {
        if (validationError != null) {
            return;
        }
        onChange?.(localValue);
        handleBlur();
    }

    const handleFocus = () => {
        setActive(true);
    }
    const handleBlur = () => {
        onBlur?.();
        inputRef.current?.blur();
        setActive(false);
        setLocalValue(initialValue);
    }

    useEffect(() => {
        if (autofocus) {
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 10);
        }
    }, []);

    return (
        <RelativeWrapper>
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
                            const rawVal = (e.currentTarget as HTMLInputElement).value;
                            updateInternally(rawVal);
                        }}
                        ref={inputRef}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        size={localValue.length || 1}
                        disabled={disabled}
                    />
                </form>
            </RenameFieldDiv>
            {
                validationError && active &&
                <RenameFieldError>
                    <p>{validationError.message}</p>
                </RenameFieldError>
            }
        </RelativeWrapper>
    );
}

export default FormRenameField;