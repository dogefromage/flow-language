import React, { FormEvent, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { FLOW_NODE_ROW_HEIGHT } from '../styles/flowStyles';

const RelativeWrapper = styled.div`
    width: 100%;
    position: relative;
`

const RenameFieldDiv = styled.div<{ $nodeRowHeight?: boolean }>`
    form {
        input {
            width: 100%;
            height: calc(0.8 * var(--list-height));
            ${({ $nodeRowHeight }) => $nodeRowHeight && css` height: calc(0.8 * ${FLOW_NODE_ROW_HEIGHT}px); ` }

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
    p {
        white-space: normal;
    }
`;

export interface NameValidationError {
    message: string;
}

export interface FormRenameFieldProps {
    value: string;
    onChange?: (newValue: string) => void;
    onBlur?: () => void;
    onValidate?: (newValue: string, oldValue: string) => NameValidationError | undefined | void;
    disabled?: boolean;
    autofocus?: boolean;
    nodeRowHeight?: boolean;
}

const FormRenameField = ({ value: initialValue, onChange, onValidate, disabled, autofocus, onBlur, nodeRowHeight }: FormRenameFieldProps) => {

    const inputRef = useRef<HTMLInputElement>(null);

    const [localValue, setLocalValue] = useState('');
    const [validationError, setValidationError] = useState<NameValidationError>();
    const [active, setActive] = useState(false);

    if (typeof initialValue !== 'string') {
        console.warn(`initialValue is not of type string.`);
    }

    // initial or external change in value
    useEffect(() => {
        updateInternally(initialValue || '');
    }, [initialValue]);

    function updateInternally(rawVal: string) {
        const newVal = rawVal.trimStart();
        setLocalValue(newVal);
        setValidationError(onValidate?.(newVal, initialValue) || undefined);
    }

    const handleFocus = () => {
        setActive(true);
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validationError == null) {
            inputRef.current?.blur(); // will cause handleBlur to be called
        } else {
            // do nothing since input invalid
        }
    }

    const handleBlur = () => {
        if (validationError == null) {
            onChange?.(localValue);
        } else {
            // if input invalid then just simply reject any changes
            setLocalValue(initialValue);
        }

        onBlur?.();
        setActive(false);
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
                $nodeRowHeight={nodeRowHeight}
            >
                <form onSubmit={handleSubmit}>
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