import styled, { css } from 'styled-components';

interface Props {
    $size?: number;
    $weight?: number;
    $color?: string;
    $button?: boolean;
    $cursor?: string;
    $disabled?: boolean;
    $spin?: boolean;
}

const MaterialSymbol = styled.span.attrs<Props>(({ className }) => ({
    className: `${className ?? ''} material-symbols-outlined`
})) <Props>`
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

export default MaterialSymbol;