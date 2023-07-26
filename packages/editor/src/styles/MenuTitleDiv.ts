import styled from "styled-components";
import { MENU_ROW_HEIGHT } from "./MenuElementDiv";

export const MenuTitleDiv = styled.div<{ $backColor?: string }>`

    width: calc(100% + 0.5rem);
    margin: 0 -0.25rem; // ugly hack

    height: ${MENU_ROW_HEIGHT * 1.2}px;
    flex-shrink: 0;

    border-radius: var(--border-radius-top);

    background-color: ${({ $backColor }) => $backColor || '#444' };
    color: white;

    display: flex;
    align-items: center;

    p
    {
        margin: 0;
        padding: 0 0.75rem;
        font-weight: bold;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;
