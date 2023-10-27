import React, { ReactNode, useState } from 'react';
import styled from 'styled-components';
import { MaterialSymbol } from '../styles/icons';

const ExpandableHeaderDiv = styled.div`
    width: 100%;
    height: 28px;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0 1rem;
    outline: 1px solid var(--color-2);
    font-weight: bold;
    user-select: none;
    cursor: pointer;

    .expand-icon {
        transform: translateX(-4px);
    }
`;

const ExpandedRegion = styled.div`
    padding: 0.5rem 1rem;
    
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

export interface FormExpandableRegionProps {
    name: string;
    children: ReactNode;
    defaultValue?: boolean;
}

const FormExpandableRegion = ({ name, children, defaultValue }: FormExpandableRegionProps) => {
    const [ expanded, setExpanded ] = useState(defaultValue || false);
    const icon = expanded ? 'expand_more' : 'chevron_right';
    return (<>
        <ExpandableHeaderDiv
            onClick={() => setExpanded(!expanded)}
        >
            <MaterialSymbol className='expand-icon'>{ icon }</MaterialSymbol>
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