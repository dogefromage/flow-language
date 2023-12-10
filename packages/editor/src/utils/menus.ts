import { useEffect } from "react";
import { trueMod } from ".";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { menusAdd, menusRemove, menusSetFocusPath, useSelectSingleMenu } from "../slices/menusSlice";
import { MenuState } from "../types";
import useTrigger from "./useTrigger";

function createMenuState(id: string, focusedPath?: number[]): MenuState {
    return {
        id,
        // type,
        isClosed: false,
        nodeStack: [],
        state: new Map(),
        focusedPath: focusedPath || [],
    }
}

export function useBindMenuState(menuId: string, initialFocusPath?: number[]) {
    const dispatch = useAppDispatch();
    const [resetTrigger, triggerReset] = useTrigger();

    useEffect(() => {
        const menuState = createMenuState(menuId, initialFocusPath);
        dispatch(menusAdd({ menuId, menuState }));
        return () => {
            dispatch(menusRemove({ menuId }))
        };
    }, [menuId, resetTrigger]);

    return {
        menuState: useAppSelector(useSelectSingleMenu(menuId)),
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
    menuId?: string, 
    elementPath?: number[], 
    onDirection?: Partial<Record<FocusControls, () => number[] | undefined | void>>
) {
    const dispatch = useAppDispatch();
    return {
        onKeyDown: (e: React.KeyboardEvent) => {
            const cb = onDirection?.[dirKeys[e.key]];
            if (cb != null && menuId) {
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
            if (!menuId || !elementPath) return;
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
        up:   () => [ ...path.slice(0, -1), trueMod(path.at(-1)! - 1, neightborCount) ],
        down: () => [ ...path.slice(0, -1), trueMod(path.at(-1)! + 1, neightborCount) ],
    }
}