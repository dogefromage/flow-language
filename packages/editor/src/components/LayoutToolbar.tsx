import styled from 'styled-components';
import { useAppSelector } from '../redux/stateHooks';
import { selectConfig } from '../slices/configSlice';
import { interlace } from '../utils/functional';
import Menus from './Menus';

const ToolbarDiv = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;

    padding: 0.25rem 1rem;

    .third {}
`;

interface Props {}

const LayoutToolbar = ({}: Props) => {
    const content = useAppSelector(selectConfig);

    const inlineMenus = content.toolbar?.inlineMenus
        ?.reduce<Record<string, React.FC[]>>((acc, [name, Comp]) => {
            acc[name] ||= [];
            acc[name].push(Comp);
            return acc;
        }, {});

    return (
        <ToolbarDiv>
            <div className="third"> {
                inlineMenus &&
                <Menus.RootInline menuId='layout'> {
                    Object.entries(inlineMenus).map(([name, sections]) =>
                        <Menus.ExpandInline key={name} name={name}> {
                            interlace(sections, Menus.Divider).map((Item, index) =>
                                <Item key={index} />
                            )
                        }
                        </Menus.ExpandInline>
                    )
                }
                </Menus.RootInline>
            }
            </div>
            <div className="third"> {
                content.toolbar?.widgetsCenter?.map((Widget, index) => 
                    <Widget key={index} />
                )
            }
            </div>
            <div className="third"> {
                content.toolbar?.widgetsRight?.map((Widget, index) => 
                    <Widget key={index} />
                )
            }
            </div>
        </ToolbarDiv>
    );
}

export default LayoutToolbar;