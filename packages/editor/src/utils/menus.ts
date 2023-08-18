import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { menusAdd, menusRemove, menusSetFocusPath, selectSingleMenu } from "../slices/menusSlice";
import { MenuTypes, MenuState } from "../types";
import useTrigger from "./useTrigger";

function createMenuState(id: string, type: MenuTypes, focusedPath?: string): MenuState {
    return {
        id,
        type,
        isClosed: false,
        nodeStack: [],
        state: new Map(),
        focusedPath: focusedPath || '',
    }
}

export function useBindMenuState(menuId: string, menuType: MenuTypes, initialFocusPath?: string) {
    const dispatch = useAppDispatch();
    const [resetTrigger, triggerReset] = useTrigger();

    useEffect(() => {
        const menuState = createMenuState(menuId, menuType, initialFocusPath);
        dispatch(menusAdd({ menuId, menuState }));
        return () => {
            dispatch(menusRemove({ menuId }))
        };
    }, [menuId, resetTrigger]);

    return {
        menuState: useAppSelector(selectSingleMenu(menuId)),
        resetMenuState: triggerReset,
    }
}


type FocusControls = 'up' | 'down' | 'in' | 'out' | 'submit';
const dirKeys: Record<string, FocusControls> = {
    'ArrowLeft':  'out',
    'ArrowRight': 'in',
    'ArrowDown' : 'down',
    'ArrowUp':    'up',
    'Enter':      'submit',
}

export function useFocusNavigation(
    menuId: string, 
    elementPath: string, 
    onDirection: Partial<Record<FocusControls, () => string | undefined | void>>
) {
    const dispatch = useAppDispatch();
    return {
        onKeyDown: (e: React.KeyboardEvent) => {
            const cb = onDirection[dirKeys[e.key]];
            if (cb != null) {
                const newPath = cb();
                if (newPath != null) {
                    dispatch(menusSetFocusPath({
                        menuId,
                        focusPath: newPath,
                    }));
                }
                e.stopPropagation();
            }
        },
        onFocus: (e: React.FocusEvent) => {
            dispatch(menusSetFocusPath({
                menuId,
                focusPath: elementPath,
            }));
            e.stopPropagation();
        }
    }
}

export function useFocusMoveHandlers(path: number[], neightborCount: number) {
    return {
        up:   () => [ ...path.slice(0, -1), mod(path.at(-1)! - 1, neightborCount) ].join('.'),
        down: () => [ ...path.slice(0, -1), mod(path.at(-1)! + 1, neightborCount) ].join('.'),
    }
}

function mod(x: number, m: number) {
    return ((x % m) + m) % m;
}