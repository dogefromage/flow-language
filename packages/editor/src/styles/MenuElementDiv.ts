import styled from "styled-components";

export const MENU_ROW_HEIGHT = 26;

export interface MenuElementDivProps {
    tabIndex?: number;
    $outlinedRed?: boolean;
}

export const MenuElementDiv = styled.div.attrs<MenuElementDivProps>(({ tabIndex }) => ({
    tabIndex: tabIndex ?? -1,
}))<MenuElementDivProps>`
    position: relative;
    width: 100%;
    height: ${MENU_ROW_HEIGHT}px;
    flex-shrink: 0;
    
    margin-top: 0.25rem;

    padding: 0 0.5rem;
    display: grid;
    align-items: center;
    
    border-radius: var(--border-radius);
    cursor: pointer;

    ${({$outlinedRed}) => $outlinedRed && 'outline: 1px solid red;'}

    &:hover,
    &:focus {
        background-color: var(--color-1);
    }

    &:focus {
        outline: solid 1px #aaa;
    }

    p {
        margin: 0;
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

`;

export const MenuCommandDiv = styled(MenuElementDiv)`
    grid-template-columns: auto 1fr;
    & > :nth-child(2) {
        text-align: right;  
        opacity: 0.7;
        overflow: hidden;
    }
`;

export const MenuExpandDiv = styled(MenuCommandDiv)`

`;

export const MenuHorizontalExpandDiv = styled(MenuElementDiv)`
    width: auto;
`;