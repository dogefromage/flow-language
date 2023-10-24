import styled from 'styled-components';

const MenuHorizontalDiv = styled.div`
    width: 100%;
    
    display: flex;
    flex-direction: row;
    gap: 1ch;

    & > div {
        margin: 0;
    }
`;

export default MenuHorizontalDiv;