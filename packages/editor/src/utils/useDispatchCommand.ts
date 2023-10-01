import { AnyAction } from "@reduxjs/toolkit";
import { useCallback } from "react";
import { selectPanels, useAppDispatch, useAppSelector, useAppStore } from "../redux/stateHooks";
import { RootState } from "../redux/store";
import { selectCommands } from "../slices/commandsSlice";
import { selectPanelManager } from "../slices/panelManagerSlice";
import { CommandBaseArgs, CommandCallTypes, CommandParameterMap, GlobalCommandArgs, ViewCommandArgs } from "../types";
import { clientToOffsetPos, offsetToClientPos } from "./panelManager";
import { useDirectRef } from "./useDirectRef";

export default function useDispatchCommand() {
    const dispatch = useAppDispatch();
    const commandsRef = useDirectRef(useAppSelector(selectCommands).commands);
    const panelsRef = useDirectRef(useAppSelector(selectPanels));
    const panelManagerRef = useDirectRef(useAppSelector(selectPanelManager));
    const store = useAppStore();

    return useCallback((
        commandId: string,
        paramMap: CommandParameterMap,
        callType: CommandCallTypes,
    ) => {
        const command = commandsRef.current[commandId];
        if (!command) {
            return console.error(`Command with id "${commandId}" not found`);
        }

        const baseArgs: CommandBaseArgs = {
            callType,
            appState: store.getState(),
        };
        let actionOrActions: AnyAction[] | AnyAction | void;

        if (command.scope === 'global') {
            const globalArgs: GlobalCommandArgs = { ...baseArgs };
            actionOrActions = command.actionCreator(globalArgs, paramMap);
        } else {
            const panelManager = panelManagerRef.current;
            const activePanelId = panelManager.activePanelId;
            const panelClientRect = panelManager.clientRects.get(activePanelId);
            if (!panelClientRect) {
                return console.error(`Command panel client rect not found`);
            }

            type ReducerState = RootState['panels'];
            const panelState = panelsRef.current[command.viewType as keyof ReducerState]?.[activePanelId];

            // center
            const offsetCenter = {
                x: panelClientRect.w / 2.0,
                y: panelClientRect.h / 2.0,
            }
            const clientCenter = offsetToClientPos(panelClientRect, offsetCenter);
            // cursor
            const clientCursor = paramMap.clientCursor;
            const offsetCursor = clientCursor
                ? clientToOffsetPos(panelClientRect, clientCursor)
                : undefined;

            if (!panelState) {
                return console.error(`No panel state found for panel with viewType ${command.viewType}.`);
            }

            const viewArgs: ViewCommandArgs = {
                ...baseArgs,
                activePanelId,
                panelClientRect,
                panelState,
                offsetCenter, clientCenter,
                offsetCursor, clientCursor,
            };
            // @ts-ignore
            actionOrActions = command.actionCreator(viewArgs, paramMap);
        }

        let actions: AnyAction[] = [];

        if (Array.isArray(actionOrActions)) {
            actions = actionOrActions;
        } else if (actionOrActions != null) {
            actions.push(actionOrActions)
        }

        for (const action of actions) {
            dispatch(action);
        }

    }, [dispatch, panelsRef, panelManagerRef, commandsRef]);
}
