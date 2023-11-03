import { HsvaColor, Wheel, hexToHsva, hsvaToHex } from '@uiw/react-color';
import React, { MutableRefObject, PropsWithChildren, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectConfig } from '../slices/configSlice';
import { menusSetClosed, menusSetNode, useSelectSingleMenu } from '../slices/menusSlice';
import { MaterialSymbol } from '../styles/icons';
import { FLOATING_MENU_WIDTH, MENU_COLOR_WHEEL_INNER_HEIGHT, MenuColorSliderWrapperDiv, MenuColorValueSliderInput, MenuColorWheelDiv, MenuCommandDiv, MenuDividerDiv, MenuElementDiv, MenuExpandDiv, MenuFloatingDiv, MenuInlineDiv, MenuInlineExpandDiv, MenuSearchDiv, MenuTitleDiv } from '../styles/menus';
import { CustomCommandParams, MenuStackNode, Vec2 } from '../types';
import { formatKeyCombination } from '../utils/keyCombinations';
import { useBindMenuState, useFocusMoveHandlers, useFocusNavigation } from '../utils/menus';
import useAdjustedAnchor from '../utils/useAdjustedAnchor';
import useClickedOutside from '../utils/useClickedOutside';
import useComposeRef from '../utils/useComposeRef';
import useDispatchCommand from '../utils/useDispatchCommand';
import useStopMouseEvents from '../utils/useStopMouseEvents';

const menuElementIds = new WeakMap<HTMLElement, string>();
const menuFocusElements = new WeakSet<HTMLElement>();
const menuRootIds = new WeakMap<HTMLElement, string>();

function findFocusIndexAndSibs(el: HTMLElement) {
    let curr: ChildNode = el;
    while (curr.previousSibling) {
        curr = curr.previousSibling;
    }

    let index = -1;
    let totalSiblings = 0;
    while (curr != null) {
        if (menuFocusElements.has(curr as HTMLElement)) {
            if (curr == el) {
                index = totalSiblings;
            }
            totalSiblings++;
        }
        curr = curr.nextSibling!;
    }
    return { index, totalSiblings };
}

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

function useMenuPath(ref: MutableRefObject<HTMLElement | null>, focusable: boolean) {
    type Focus = {
        path: number[];
        totalSiblings: number;
    };
    const [menuPath, setMenuPath] = useState<{
        menuId: string;
        elementId: string;
        depth: number;
        focus?: Focus;
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
        if (focusable) {
            menuFocusElements.add(topElement);
        } else {
            menuFocusElements.delete(topElement);
        }

        let depth = -1;
        const focusPath: number[] = [];
        let curr: HTMLElement | null = topElement;

        while (curr != null) {
            const elementId = menuElementIds.get(curr);
            if (elementId != null) {
                depth++;
            }

            if (menuFocusElements.has(curr)) {
                const { index } = findFocusIndexAndSibs(curr);
                focusPath.unshift(index);
            }


            const menuId = menuRootIds.get(curr);
            if (menuId != null) {
                let focus: Focus | undefined = undefined;
                if (menuFocusElements.has(topElement)) {
                    const { totalSiblings } = findFocusIndexAndSibs(topElement);
                    focus = {
                        path: focusPath,
                        totalSiblings,
                    };
                }

                setMenuPath({
                    menuId,
                    elementId: topElementId,
                    // path,
                    depth,
                    focus,
                });
                return;
            }
            curr = curr.parentElement;
        }

        console.error('Could not find menu root id. Did you add a root element to the menu tree? element=', topElement);
    }, [ref.current]);

    return menuPath;
}

function comparePath(X: number[], Y: number[]) {
    if (X.length != Y.length) return false;
    for (let i = 0; i < X.length; i++) {
        if (X[i] !== Y[i]) return false;
    }
    return true;
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
        const menuPath = useMenuPath(divRef, true);
        const menuId = menuPath?.menuId;

        const dispatch = useAppDispatch();
        const menu = useAppSelector(useSelectSingleMenu(menuId));

        const focus = menuPath?.focus;

        useEffect(() => {
            if (menu && focus && comparePath(menu.focusedPath, focus.path)) {
                setTimeout(() => divRef.current?.focus(), 20);
            }
        }, [menu?.focusedPath, focus?.path]);

        const handlers = useFocusNavigation(menuId, focus?.path,
            focus ? {
                out: () => focus.path.slice(0, -1),
                in: () => {
                    expand();
                    return [...focus.path, 0];
                },
                ...useFocusMoveHandlers(focus.path, focus.totalSiblings),
            } : undefined
        );

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
                {...handlers}
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
    params?: CustomCommandParams;
}

const MenuCommand = React.forwardRef<HTMLDivElement, PropsWithChildren<MenuCommandProps>>((
    { commandId, params }, ref) => {
    const dispatch = useAppDispatch();
    const divRef = useComposeRef(ref);
    const menuPath = useMenuPath(divRef, true);
    const menu = useAppSelector(useSelectSingleMenu(menuPath?.menuId));
    const { commands } = useAppSelector(selectConfig);
    const dispatchCommand = useDispatchCommand();

    const command = commands?.[commandId];

    function invokeCommand() {
        if (!command || !menu) return;
        dispatch(menusSetClosed({ menuId: menu.id }));
        dispatchCommand(command.id, params);
    }

    const focus = menuPath?.focus;

    useEffect(() => {
        if (menu && focus && comparePath(menu.focusedPath, focus.path)) {
            setTimeout(() => divRef.current?.focus(), 20);
        }
    }, [menu?.focusedPath, focus?.path]);

    const handlers = useFocusNavigation(menu?.id, focus?.path,
        focus ? {
            out: () => focus.path.slice(0, -1),
            submit: invokeCommand,
            ...useFocusMoveHandlers(focus.path, focus.totalSiblings),
        } : undefined
    );

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
            onClick={e => {
                e.stopPropagation();
                invokeCommand();
            }}
            tabIndex={-1}
            {...handlers}
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
    const { menuState, resetMenuState } = useBindMenuState(menuId);
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

interface MenuTextProps {
    text: string;
}
const MenuText = ({ text }: PropsWithChildren<MenuTextProps>) => {
    return (
        <MenuElementDiv>
            <p>{text}</p>
        </MenuElementDiv>
    );
}

interface MenuButtonProps {
    name: string;
    onPush?: () => void;
    unactive?: boolean;
}
const MenuButton = React.forwardRef<HTMLDivElement, PropsWithChildren<MenuButtonProps>>((
    { name, onPush, unactive }, ref) => {
    const dispatch = useAppDispatch();
    const divRef = useComposeRef(ref);
    const menuPath = useMenuPath(divRef, true);
    const menuId = menuPath?.menuId;

    const menu = useAppSelector(useSelectSingleMenu(menuPath?.menuId));
    const focus = menuPath?.focus;

    useEffect(() => {
        if (menu && focus && comparePath(menu.focusedPath, focus.path)) {
            setTimeout(() => divRef.current?.focus(), 20);
        }
    }, [menu?.focusedPath, focus?.path]);

    const handlers = useFocusNavigation(menu?.id, focus?.path,
        focus ? {
            out: () => focus.path.slice(0, -1),
            submit,
            ...useFocusMoveHandlers(focus.path, focus.totalSiblings),
        } : undefined
    );

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
            $unactive={unactive}
            {...handlers}
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
    const menuPath = useMenuPath(divRef, true);
    const menu = useAppSelector(useSelectSingleMenu(menuPath?.menuId));
    const inputRef = useRef<HTMLInputElement>(null);

    const focus = menuPath?.focus;

    useEffect(() => {
        if (menu && focus && comparePath(menu.focusedPath, focus.path)) {
            setTimeout(() => inputRef.current?.focus(), 20);
            // setTimeout(() => inputRef.current?.select(), 5);
        }
    }, [menu?.focusedPath, focus?.path]);

    const handlers = useFocusNavigation(menu?.id, focus?.path,
        focus ? {
            ...useFocusMoveHandlers(focus.path, focus.totalSiblings),
        } : undefined
    );

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
                    onChange={e => {
                        const target = e.currentTarget as HTMLInputElement;
                        onChange(target.value);
                    }}
                    placeholder={placeholder}
                    autoComplete='off'
                    autoCorrect='off'
                    autoSave='off'
                    {...handlers}
                    ref={inputRef}
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
    initialFocusPath?: number[];
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
    const menuPath = useMenuPath(divRef, true);
    const menu = useAppSelector(useSelectSingleMenu(menuPath?.menuId));

    const focus = menuPath?.focus;

    useEffect(() => {
        if (menu && focus && comparePath(menu.focusedPath, focus.path)) {
            setTimeout(() => divRef.current?.focus(), 20);
        }
    }, [menu?.focusedPath, focus?.path]);

    const handlers = useFocusNavigation(menu?.id, focus?.path,
        focus ? {
            out: () => focus.path.slice(0, -1),
            submit,
            ...useFocusMoveHandlers(focus.path, focus.totalSiblings),
        } : undefined
    );


    function submit() {
        window.open(href, '_blank');
    }

    return (
        <MenuCommandDiv ref={divRef} {...handlers}>
            <a href={href} target='_blank'>{name}</a>
            <MaterialSymbol>link</MaterialSymbol>
        </MenuCommandDiv>
    );
});

const Menus = {
    Title: MenuTitle,
    Text: MenuText,
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