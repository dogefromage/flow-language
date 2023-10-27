import styled, { css } from 'styled-components';

export interface SymbolButtonProps {
    disabled?: boolean;
}

export const SymbolButton = styled.button<SymbolButtonProps>`
    width: 1.4rem;
    aspect-ratio: 1;

    outline: none;
    border: none;
    background-color: unset;
    
    display: flex;
    align-items: center;
    justify-content: center;
    
    cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer' };

    &:hover {
        transform: var(--hover-transform);
    }
`;


interface MaterialSymbolProps {
    $size?: number;
    $weight?: number;
    $color?: string;
    $button?: boolean;
    $cursor?: string;
    $disabled?: boolean;
    $spin?: boolean;
}

export const MaterialSymbol = styled.span.attrs<MaterialSymbolProps>(({ className }) => ({
    className: `${className ?? ''} material-symbols-outlined`
})) <MaterialSymbolProps>`
    user-select: none;
    ${({ $size }) => $size && `font-size: ${$size}px !important;`}
    ${({ $color }) => `color: ${$color};`}
    
    font-variation-settings:
        'FILL' 0,
        'wght' ${({ $weight }) => $weight || 600},
        'GRAD' 0,
        'opsz' 48
    ;

    ${({ $button }) => $button && css`
        cursor: pointer;
        &:hover {
            transform: scale(1.2);
        }
    `}

    ${({ $cursor }) => $cursor && `cursor: ${$cursor};`}

    ${({ $disabled }) => $disabled && 'cursor: not-allowed;'}
    
    ${({ $spin }) => $spin && css`
        @keyframes spin-round {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
        }
        animation: spin-round 1s linear infinite;
    `}
`;
