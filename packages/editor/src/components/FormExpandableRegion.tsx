import React, { ReactNode, useState } from 'react';
import styled from 'styled-components';
import MaterialSymbol from '../styles/MaterialSymbol';

const ExpandableHeaderDiv = styled.div`
    width: 100%;
    height: 28px;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0 1rem;
    background-color: #ddd;
    font-weight: bold;
    
    user-select: none;

    cursor: pointer;
`;

const ExpandedRegion = styled.div`
    padding: 0.25rem 1rem;
    
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

interface Props {
    name: string;
    children: ReactNode;
    defaultValue?: boolean;
}

const FormExpandableRegion = ({ name, children, defaultValue }: Props) => {
    const [ expanded, setExpanded ] = useState(defaultValue || false);
    const icon = expanded ? 'expand_more' : 'chevron_right';
    return (<>
        <ExpandableHeaderDiv
            onClick={() => setExpanded(!expanded)}
        >
            <MaterialSymbol>{ icon }</MaterialSymbol>
            { name }
        </ExpandableHeaderDiv>
        {
            expanded &&
            <ExpandedRegion>
                { children }
            </ExpandedRegion>
        }
    </>);
}

export default FormExpandableRegion;