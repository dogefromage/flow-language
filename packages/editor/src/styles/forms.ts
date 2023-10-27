import styled, { css } from "styled-components";
import { FLOW_NODE_ROW_HEIGHT } from "./flowStyles";

export const SelectOptionDiv = styled.div<{ 
    disabled?: boolean, 
    $widthInline?: boolean,
    $centerValue?: boolean,
}>`
    position: relative;
    height: 1.6rem;
    max-height: 100%;
    ${({ $widthInline }) => $widthInline && 'width: fit-content;' }

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
    
    padding: 0 0.5rem;
    border-radius: var(--border-radius);
    background-color: var(--color-2);

    cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer' };

    ${({ disabled }) => disabled && `color: #00000066;` }

    p {
        ${({ $centerValue }) => $centerValue && css`
            flex-grow: 1;
            text-align: center;
        `}
        
        margin: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
`;

export const SlidableInputDiv = styled.div`
    position: relative;
    width: 100%;
    height: ${FLOW_NODE_ROW_HEIGHT * 0.8}px;
    display: flex;
    align-items: center;

    form, input {
        width: 100%;
        height: 100%;

        position: absolute;

        left: 0;
        top: 0;
    }
    
    form {
        input {
            padding: 0 0.5em;
            background-color: var(--color-1);
            border: none;
            outline: none;            
            text-align: right;
            font-weight: bold;
            font-size: 14px;

            &:focus {
                text-align: center;
            }

            border-radius: var(--border-radius);
        }
    }
    
    .name {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        left: 0.5rem;

        margin: 0;

        pointer-events: none;
        font-size: 16px;

        width: 60%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
`;
