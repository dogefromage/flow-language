import styled from 'styled-components';
import { MENU_ROW_HEIGHT } from './MenuElementDiv';

const MenuHorizontalDiv = styled.div`
    width: 100%;
    
    display: flex;
    flex-direction: row;
    gap: 1ch;

    padding: 0.25rem 1rem;

    & > div {
        margin: 0;
    }
`;

export default MenuHorizontalDiv;