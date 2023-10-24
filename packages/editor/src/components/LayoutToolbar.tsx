import React from 'react';
import toolbarShape from '../content/menus/toolbar.json';
import { InlineMenuShape } from '../types';
import MenuRootInline from './MenuRootInline';
import styled from 'styled-components';
import ProjectSelectionDropdown from './ProjectSelectionDropdown';

const ToolbarDiv = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;

    padding: 0.25rem 1rem;
`;

interface Props {

}

const LayoutToolbar = ({}: Props) => {
    return (
        <ToolbarDiv>
            <MenuRootInline
                menuId='layout'
                menuType={'toolbar'}
                shape={toolbarShape as InlineMenuShape}
            />
            <ProjectSelectionDropdown />
            <p>Not signed in.</p>
        </ToolbarDiv>
    );
}

export default LayoutToolbar;