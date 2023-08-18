import styled from 'styled-components';

export interface SymbolButtonProps {
    disabled?: boolean;
}

const SymbolButton = styled.button<SymbolButtonProps>`
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

export default SymbolButton;