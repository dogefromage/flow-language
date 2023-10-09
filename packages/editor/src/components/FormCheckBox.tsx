import React from 'react';
import styled from 'styled-components';

const CheckBoxDiv = styled.div<{ $checked: boolean, $disabled: boolean }>`
    /* width: 18px; */
    width: 90px;
    height: 18px;
    aspect-ratio: 1;

    background-color: ${({ $checked, theme }) =>
        $checked ? theme.colors.general.active : 'var(--color-1)'};

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 3px;

    cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};

    span {
        color: white;
    }
`;

interface Props {
    checked: boolean;
    setChecked: (newValue: boolean) => void;
    disabled?: boolean;
}

const FormCheckBox = ({ checked, setChecked, disabled }: Props) => {
    return (
        <CheckBoxDiv
            onClick={e => {
                if (disabled) return;
                e.stopPropagation();
                setChecked(!checked);
            }}
            onDoubleClick={e => e.stopPropagation()}
            $checked={checked}
            $disabled={disabled || false}
        > {
                checked ? 'true' : 'false'
                // <MaterialSymbol $size={20} $weight={800}>done</MaterialSymbol>
            }
        </CheckBoxDiv>
    );
}

export default FormCheckBox;