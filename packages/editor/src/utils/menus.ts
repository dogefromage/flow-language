import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { menusAdd, menusRemove, selectSingleMenu } from "../slices/menusSlice";
import { MenuTypes, MenuState } from "../types";
import useTrigger from "./useTrigger";

function createMenuState(id: string, type: MenuTypes): MenuState {
    return {
        id,
        type,
        isClosed: false,
        nodeStack: [],
        state: new Map(),
    }
}

export function useBindMenuState(menuId: string, menuType: MenuTypes) {
    const dispatch = useAppDispatch();
    const [resetTrigger, triggerReset] = useTrigger();

    useEffect(() => {
        const menuState = createMenuState(menuId, menuType);
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