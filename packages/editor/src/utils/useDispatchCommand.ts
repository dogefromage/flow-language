import { useCallback } from "react";
import { useAppDispatch, useAppStore } from "../redux/stateHooks";
import { selectConfig } from "../slices/configSlice";
import { selectPanelManager } from "../slices/panelManagerSlice";
import { AppAction, BaseCommandParams, CustomCommandParams, PanelState, ViewCommandParams } from "../types";
import { clientToOffsetPos, offsetToClientPos } from "./panelManager";
import { selectPanelStateUnmemoized } from "../redux/panelStateEnhancer";

export default function useDispatchCommand() {
    const dispatch = useAppDispatch();
    const store = useAppStore();

    return useCallback((commandId: string, customParams: CustomCommandParams = {}) => {
        const appState = store.getState();
        const appContent = selectConfig(appState);

        const command = appContent.commands?.[commandId];
        if (!command) {
            return console.error(`Command with id "${commandId}" not found`);
        }
        
        const clientCursor = customParams.clientCursor;
        const baseArgs: BaseCommandParams = {
            appState,
            clientCursor,
        };
        const returnedActions: (void | AppAction | AppAction[])[] = [];

        if (command.scope === 'global') {
            returnedActions.push(command.actionCreator(baseArgs, customParams));
        } else {
            const panelManager = selectPanelManager(appState);
            const targetPanelId = customParams.targetPanelId ?? panelManager.activePanelId;
            const clientPanelRect = panelManager.clientRects.get(targetPanelId);
            if (!clientPanelRect) {
                return console.error(`Command panel client rect not found`);
            }

            const panelState = selectPanelStateUnmemoized(command.viewType, targetPanelId)(appState);

            // center
            const offsetPanelCenter = {
                x: clientPanelRect.w / 2.0,
                y: clientPanelRect.h / 2.0,
            }
            const clientPanelCenter = offsetToClientPos(clientPanelRect, offsetPanelCenter);
            // cursor
            const offsetCursor = clientCursor
                ? clientToOffsetPos(clientPanelRect, clientCursor)
                : undefined;

            if (!panelState) {
                return console.error(`No panel state found for panel with viewType ${command.viewType}.`);
            }

            const viewArgs: ViewCommandParams<PanelState> = {
                ...baseArgs,
                targetPanelId,
                clientPanelRect,
                panelState,
                offsetPanelCenter, 
                clientPanelCenter,
                offsetCursor,
            };
            const retAction = command.actionCreator(viewArgs, customParams);
            returnedActions.push(retAction);
        }
        
        function filterVoid<T>(t: T | void): t is Exclude<typeof t, void> {
            return t != null;
        }
        
        returnedActions
            .filter(filterVoid)
            .flat()
            .forEach(action => dispatch(action));
        
    }, [ dispatch, store ]);
}
