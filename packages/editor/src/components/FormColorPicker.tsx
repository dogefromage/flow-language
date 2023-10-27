import { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '../redux/stateHooks';
import { Vec2 } from '../types';
import Menus from './Menus';

interface ColorDivProps { color: string };

const ColorPickerDiv = styled.div.attrs<ColorDivProps>(({ color }) => ({
    style: { backgroundColor: color }
})) <ColorDivProps>`
    width: 100%;
    height: 100%;
    background-color: var(--color);

    /* makes outline darker version of input color */
    outline: solid 2px #00000044;
    outline-offset: -2px;

    &:hover {
        opacity: 0.8;
    }
`;

// const COLOR_ELEMENT_KEY = 'color-input';

// const colorPickerMenuShape: FloatingMenuShape = {
//     type: 'floating',
//     list: [
//         {
//             type: 'title',
//             key: 'title',
//             name: 'Color Picker',
//             color: 'black',
//         },
//         {
//             type: 'color',
//             key: COLOR_ELEMENT_KEY,
//             name: 'Color Wheel',
//         }
//     ]
// }

interface Props {
    value: string;
    onChange: (newColor: string, actionToken: string) => void;
}

const FormColorPicker = ({ value, onChange }: Props) => {
    // const dispatch = useAppDispatch();
    const [menu, setMenu] = useState<{
        anchor: Vec2;
        menuId: string;
    }>();

    return (<>
        <ColorPickerDiv
            color={value}
            onClick={e => {
                const target = e.currentTarget as HTMLDivElement;
                const rect = target.getBoundingClientRect();
                setMenu({
                    anchor: { x: rect.left, y: rect.bottom },
                    menuId: `color-picker:${uuidv4()}`
                })
            }}
        /> {
            menu &&
            <Menus.RootFloating menuId={menu.menuId} anchor={menu.anchor} 
                onClose={() => setMenu(undefined)}>
                <Menus.Title name='Color Picker' color='black' />
                <Menus.ColorWheel value={value} onChange={v => onChange(v, uuidv4() /* needs action token */)} />
            </Menus.RootFloating>
        }
    </>);
}

export default FormColorPicker;