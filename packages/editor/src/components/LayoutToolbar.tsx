import styled from 'styled-components';
import { useAppSelector } from '../redux/stateHooks';
import { selectContent } from '../slices/contentSlice';
import Menus from './Menus';
import ProjectSelectionDropdown from './ProjectSelectionDropdown';

const ToolbarDiv = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;

    padding: 0.25rem 1rem;
`;

interface Props {}

const LayoutToolbar = ({}: Props) => {
    const content = useAppSelector(selectContent);

    return (
        <ToolbarDiv>
            <Menus.RootInline menuId='layout'> {
                content.toolbarInlineMenuComponents.map((InlineMenu, index) =>
                    <InlineMenu key={index} />
                )
            }
            </Menus.RootInline>
            <ProjectSelectionDropdown /> {
                content.toolbarWidgetComponents.map((Widget, index) => 
                    <Widget key={index} />
                )
            }
        </ToolbarDiv>
    );
}

export default LayoutToolbar;