import styled from 'styled-components';

interface Props {
    $size?: number;
    $weight?: number;
}

const MaterialSymbol = styled.span.attrs<Props>(({ className }) => ({
    className: `${className ?? ''} material-symbols-outlined`
}))<Props>`
    user-select: none;
    ${({ $size }) => $size && `font-size: ${$size}px !important;`}
    
    font-variation-settings:
        'FILL' 0,
        'wght' ${({ $weight }) => $weight || 600},
        'GRAD' 0,
        'opsz' 48
`;

export default MaterialSymbol;