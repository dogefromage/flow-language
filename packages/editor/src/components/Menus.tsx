import React, { MutableRefObject, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectContent } from '../slices/contentSlice';
import { menusSetClosed, menusSetNode, useSelectSingleMenu } from '../slices/menusSlice';
import { MaterialSymbol } from '../styles/icons';
import { FLOATING_MENU_WIDTH, MENU_COLOR_WHEEL_INNER_HEIGHT, MenuColorSliderWrapperDiv, MenuColorValueSliderInput, MenuColorWheelDiv, MenuCommandDiv, MenuElementDiv, MenuExpandDiv, MenuFloatingDiv, MenuInlineDiv, MenuInlineExpandDiv, MenuSearchDiv, MenuTitleDiv, MenuDividerDiv } from '../styles/menus';
import { MenuStackNode, Vec2 } from '../types';
import { formatKeyCombination } from '../utils/keyCombinations';
import { useBindMenuState } from '../utils/menus';
import useAdjustedAnchor from '../utils/useAdjustedAnchor';
import useClickedOutside from '../utils/useClickedOutside';
import useComposeRef from '../utils/useComposeRef';
import useDispatchCommand from '../utils/useDispatchCommand';
import styled from 'styled-components';
import ReactDOM from 'react-dom';
import useStopMouseEvents from '../utils/useStopMouseEvents';
import { HsvaColor, Wheel, hexToHsva, hsvaToHex } from '@uiw/react-color';

const menuElementIds = new WeakMap<HTMLElement, string>();
const menuRootIds = new WeakMap<HTMLElement, string>();

function useMenuRoot(ref: MutableRefObject<HTMLElement | null>, rootId: string) {
    const [rootSet, setRootSet] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (el == null) {
            return;
        }
        menuRootIds.set(el, rootId);
        setRootSet(true);
    }, [ref.current]);
    return rootSet;
}

function useMenuPath(ref: MutableRefObject<HTMLElement | null>) {
    const [menuPath, setMenuPath] = useState<{
        menuId: string;
        elementId: string;
        path: string[];
        depth: number;
    }>();

    useEffect(() => {
        const topElement = ref.current;
        if (topElement == null) {
            return;
        }

        let topElementId = menuElementIds.get(topElement);
        if (!topElementId) {
            menuElementIds.set(topElement, (topElementId = uuidv4()));
        }

        const path: string[] = [];
        let curr: HTMLElement | null = topElement;
        while (curr != null) {
            const elementId = menuElementIds.get(curr);
            if (elementId != null) {
                path.push(elementId);
            }

            const menuId = menuRootIds.get(curr);
            if (menuId != null) {
                setMenuPath({
                    menuId,
                    elementId: topElementId,
                    path,
                    depth: path.length - 1,
                });
                return;
            }
            curr = curr.parentElement;
        }

        console.error('Could not find menu root id. Did you add a root element to the menu tree? element=', topElement);
    }, [ref.current]);

    return menuPath;
}


interface MenuInlineProps {}

const MenuInline = React.forwardRef<HTMLDivElement, PropsWithChildren<MenuInlineProps>>((
    { children }, ref) => {
    return (
        <MenuInlineDiv ref={ref}>
            {children}
        </MenuInlineDiv>
    );
});

interface MenuExpandProps {
    name: string;
    childWidth?: number;
}

function createMenuExpand(expandType: 'inline' | 'normal') {
    const ExpandComponent = expandType === 'inline' ?
        MenuInlineExpandDiv : MenuExpandDiv;

    function makeStackNode(elementId: string, rect: DOMRect): MenuStackNode {
        if (expandType === 'inline') {
            return {
                elementId,
                leftAnchor: {
                    x: rect.left,
                    y: rect.bottom,
                },
                parentWidth: 0,
            };
        } else {
            return {
                elementId,
                leftAnchor: {
                    x: rect.left,
                    y: rect.top,
                },
                parentWidth: rect.width,
            }
        }
    }

    // MenuExpand / MenuExpandInline
    return React.forwardRef<HTMLDivElement, PropsWithChildren<MenuExpandProps>>((
        { name, children, childWidth }, ref) => {
        const divRef = useComposeRef(ref);
        const menuPath = useMenuPath(divRef);
        const menuId = menuPath?.menuId;

        const dispatch = useAppDispatch();
        const menu = useAppSelector(useSelectSingleMenu(menuId));

        // const joinedPath = focusPath.join('.');
        // useEffect(() => {
        //     if (menu.focusedPath == joinedPath) {
        //         divRef.current?.focus();
        //     }
        // }, [ menu.focusedPath ]);

        // const handlers = useFocusNavigation(menuId, joinedPath, {
        //     // out: () => focusPath.slice(0, -1).join('.'),
        //     in: () => {
        //         expand();
        //         return [ ...focusPath, 0 ].join('.');
        //     },
        //     ...useFocusMoveHandlers(focusPath, neightbourCount),
        // });

        const expand = () => {
            if (!menuPath || !divRef.current) return;
            const rect = divRef.current.getBoundingClientRect();
            const { menuId, elementId, depth } = menuPath;

            dispatch(menusSetNode({
                menuId,
                depth,
                node: makeStackNode(elementId, rect),
            }));
        }

        const depth = menuPath?.depth ?? -1;
        const currentStackEl = menu?.nodeStack[depth];
        const expanded = currentStackEl?.elementId === menuPath?.elementId;

        return (
            <ExpandComponent
                ref={divRef}
                onMouseEnter={expand}
                tabIndex={-1}
            // {...handlers}
            >
                <p>{name}</p> {
                    expandType === 'normal' &&
                    <MaterialSymbol $size={20}>chevron_right</MaterialSymbol>
                }{
                    expanded && currentStackEl &&
                    <MenuFloating leftAnchor={currentStackEl.leftAnchor}
                        parentWidth={currentStackEl.parentWidth} desiredWidth={childWidth}>
                        {children}
                    </MenuFloating>
                }
            </ExpandComponent>
        );
    });
}

interface MenuCommandProps {
    commandId: string;
}

const MenuCommand = React.forwardRef<HTMLDivElement, PropsWithChildren<MenuCommandProps>>((
    { commandId }, ref) => {
    const dispatch = useAppDispatch();
    const divRef = useComposeRef(ref);
    const menuPath = useMenuPath(divRef);
    const menu = useAppSelector(useSelectSingleMenu(menuPath?.menuId));
    const { commands } = useAppSelector(selectContent);
    const dispatchCommand = useDispatchCommand();

    const command = commands[commandId];

    function invokeCommand(e: React.MouseEvent) {
        e.stopPropagation();
        if (!command || !menu) return;
        dispatch(menusSetClosed({ menuId: menu.id }));
        dispatchCommand(command.id, {});
    }

    // const joinedPath = focusPath.join('.');
    // useEffect(() => {
    //     if (menu.focusedPath == joinedPath) {
    //         divRef.current?.focus();
    //     }
    // }, [ menu.focusedPath ]);

    // const handlers = useFocusNavigation(menuId, joinedPath, {
    //     out: () => focusPath.slice(0, -1).join('.'),
    //     submit: invoke,
    //     ...useFocusMoveHandlers(focusPath, neightbourCount),
    // });

    let display = { text: commandId, info: '' };
    if (command != null) {
        const keyComb = command.keyCombinations?.[0];
        display = {
            text: command.name,
            info: keyComb ? formatKeyCombination(keyComb) : '',
        };
    }

    return (
        <MenuCommandDiv
            ref={divRef}
            onClick={invokeCommand}
            tabIndex={-1}
        // {...handlers}
        >
            <p>{display.text}</p> {
                display.info &&
                <p>{display.info}</p>
            }
        </MenuCommandDiv>
    );
});

interface MenuFloatingProps {
    leftAnchor: Vec2;
    parentWidth: number;
    desiredWidth?: number;
}

const MenuFloating = ({ children, leftAnchor, parentWidth, desiredWidth }: PropsWithChildren<MenuFloatingProps>) => {

    const divRef = useRef<HTMLDivElement>(null);
    const { adjustedAnchor } = useAdjustedAnchor(divRef, leftAnchor,
        { w: parentWidth, h: 0 },
        { type: 'flip', sign: 1 },
        { type: 'clip', sign: 1 },
    );

    return (
        <MenuFloatingDiv
            ref={divRef}
            $anchor={adjustedAnchor}
            $menuWidth={desiredWidth ?? FLOATING_MENU_WIDTH}
        >
            {children}
        </MenuFloatingDiv>
    );
};

interface MenuRootProps {
    menuId: string;
}

const MenuRootInline = ({ menuId, children }: PropsWithChildren<MenuRootProps>) => {
    const { menuState, resetMenuState } = useBindMenuState(menuId, 'misc');
    const divRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (menuState?.isClosed) {
            resetMenuState();
        }
    }, [menuState?.isClosed]);

    useClickedOutside(divRef, () => {
        if (menuState?.nodeStack.length) {
            dispatch(menusSetClosed({ menuId }));
        }
    });

    const rootSet = useMenuRoot(divRef, menuId);

    return (
        <MenuInline ref={divRef}>
            {rootSet && children}
        </MenuInline>
    );
}

interface MenuTitleProps {
    name: string;
    color?: string;
}
const MenuTitle = ({ name, color }: PropsWithChildren<MenuTitleProps>) => {
    return (
        <MenuTitleDiv $backColor={color}>
            <p>{name}</p>
        </MenuTitleDiv>
    );
}

interface MenuButtonProps {
    name: string;
    onPush?: () => void;
}
const MenuButton = React.forwardRef<HTMLDivElement, PropsWithChildren<MenuButtonProps>>((
    { name, onPush }, ref) => {
    const dispatch = useAppDispatch();
    const divRef = useComposeRef(ref);
    const menuPath = useMenuPath(divRef);
    const menuId = menuPath?.menuId;

    // const menu = useAppSelector(selectSingleMenu(menuPath?.menuId));

    // const joinedPath = focusPath.join('.');
    // useEffect(() => {
    //     if (menu.focusedPath == joinedPath) {
    //         divRef.current?.focus();
    //     }
    // }, [menu.focusedPath]);

    // const handlers = useFocusNavigation(menuId, joinedPath, {
    //     out: () => focusPath.slice(0, -1).join('.'),
    //     submit,
    //     ...useFocusMoveHandlers(focusPath, neightbourCount),
    // });

    function submit() {
        if (menuId == null) return;
        dispatch(menusSetClosed({ menuId }));
        onPush?.();
    }

    return (
        <MenuElementDiv
            tabIndex={-1}
            ref={divRef}
            onClick={e => {
                e.stopPropagation();
                submit();
            }}
        // {...handlers}
        > {
                <p>{name}</p>
            }
        </MenuElementDiv>
    );
});

interface MenuSearchProps {
    value: string;
    placeholder?: string;
    onChange: (newValue: string) => void;
}

const MenuSearch = React.forwardRef<HTMLDivElement, PropsWithChildren<MenuSearchProps>>((
    { value, onChange, placeholder }, ref) => {
    const divRef = useComposeRef(ref);
    const menuPath = useMenuPath(divRef);
    // const dispatch = useAppDispatch();
    // const menuId = menuPath?.menuId;
    // const menu = useAppSelector(selectSingleMenu(menuId));
    // const inputRef = useRef<HTMLInputElement>(null);

    // const joinedPath = focusPath.join('.');
    // useEffect(() => {
    //     if (menu.focusedPath == joinedPath) {
    //         inputRef.current?.focus();
    //         setTimeout(() => inputRef.current?.select(), 5);
    //     }
    // }, [ menu.focusedPath ]);

    // const handlers = useFocusNavigation(menuId, joinedPath, {
    //     ...useFocusMoveHandlers(focusPath, neightbourCount),
    // });

    // const searchValue = menu?.state.get(element.key) ?? '';

    return (
        <MenuSearchDiv ref={divRef}>
            <form
                onSubmit={e => {
                    e.preventDefault();
                }}
            >
                <input
                    type='text'
                    value={value}
                    // ref={inputRef}
                    onChange={e => {
                        const target = e.currentTarget as HTMLInputElement;
                        onChange(target.value);
                        // dispatch(menusSetState({
                        //     menuId,
                        //     key: element.key,
                        //     value: target.value,
                        // }))
                    }}
                    placeholder={placeholder}
                    autoComplete='off'
                    autoCorrect='off'
                    autoSave='off'
                // {...handlers}
                />
            </form>
        </MenuSearchDiv>
    );
});

interface MenuColorWheelProps {
    value?: string;
    onChange: (newValue: string) => void;
}

const MenuColorWheel = React.forwardRef<HTMLDivElement, PropsWithChildren<MenuColorWheelProps>>((
    { value, onChange }, ref) => {
    const divRef = useComposeRef(ref);
    // const menuPath = useMenuPath(divRef);

    const hexColor = value ?? '#ffffff';
    const hsvaColor = hexToHsva(hexColor);

    const setColorValue = (newValue: number) => {
        const newHsva: HsvaColor = {
            ...hsvaColor,
            v: newValue,
        }
        onChange(hsvaToHex(newHsva));
    }

    const colorValue = hsvaColor.v;
    const maxValueHex = hsvaToHex({ ...hsvaColor, v: 100 });

    return (
        <MenuColorWheelDiv ref={divRef}>
            <p>Hue/Saturation</p>
            <p>Value</p>
            <Wheel
                width={MENU_COLOR_WHEEL_INNER_HEIGHT}
                height={MENU_COLOR_WHEEL_INNER_HEIGHT}
                color={hexColor}
                onChange={colorResult => onChange(colorResult.hex)}
            />
            <MenuColorSliderWrapperDiv>
                <MenuColorValueSliderInput
                    maxValue={maxValueHex}
                    value={colorValue ?? 0}
                    onChange={e => {
                        const colorValue = (e.target as HTMLInputElement).valueAsNumber;
                        setColorValue(colorValue);
                    }}
                />
            </MenuColorSliderWrapperDiv>
        </MenuColorWheelDiv>
    );
});

const FloatingMenuFixedDiv = styled.div`
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
`;

interface MenuRootFloatingProps {
    menuId: string;
    // menuType: MenuTypes;
    initialFocusPath?: string;
    onClose: () => void;
    anchor: Vec2;
    desiredWidth?: number;
}

const MenuRootFloating = ({ menuId, /* menuType, */ onClose, anchor,
    initialFocusPath, desiredWidth, children }: PropsWithChildren<MenuRootFloatingProps>) => {
    const { menuState } = useBindMenuState(menuId, initialFocusPath);
    const divRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();
    const rootSet = useMenuRoot(divRef, menuId);

    useEffect(() => {
        if (menuState?.isClosed) {
            onClose();
        }
    });

    const close = () => {
        dispatch(menusSetClosed({ menuId }));
    }
    useClickedOutside(divRef, close);

    const stopMouseHandlers = useStopMouseEvents();

    return ReactDOM.createPortal(
        <FloatingMenuFixedDiv
            {...stopMouseHandlers}
            ref={divRef}
        >
            {
                rootSet && menuState &&
                <MenuFloating leftAnchor={anchor} parentWidth={0} desiredWidth={desiredWidth}>
                    {children}
                </MenuFloating>
            }
        </FloatingMenuFixedDiv>,
        document.querySelector(`#menu-portal-mount`)!
    );
}

interface MenuHyperLinkProps {
    name: string;
    href: string;
}

const MenuHyperLink = React.forwardRef<HTMLDivElement, PropsWithChildren<MenuHyperLinkProps>>((
    { name, href }, ref) => {
    const divRef = useComposeRef(ref);
    const menuPath = useMenuPath(divRef);

    return (
        <MenuCommandDiv ref={divRef}>
            <a href={href} target='_blank'>{ name }</a>
            <MaterialSymbol>link</MaterialSymbol>
        </MenuCommandDiv>
    );
});

const Menus = {
    Title: MenuTitle,
    Command: MenuCommand,
    Button: MenuButton,
    Search: MenuSearch,
    ColorWheel: MenuColorWheel,
    ExpandInline: createMenuExpand('inline'),
    Expand: createMenuExpand('normal'),
    RootInline: MenuRootInline,
    RootFloating: MenuRootFloating,
    Divider: MenuDividerDiv,
    HyperLink: MenuHyperLink,
}
export default Menus;