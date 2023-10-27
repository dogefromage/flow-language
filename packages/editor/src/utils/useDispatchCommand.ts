import { useCallback } from "react";
import { RootState } from "../redux/rootReducer";
import { selectPanels, useAppDispatch, useAppStore } from "../redux/stateHooks";
import { selectContent } from "../slices/contentSlice";
import { selectPanelManager } from "../slices/panelManagerSlice";
import { ActionCreatorReturnType, BaseCommandArgs, CustomCommandParams, PanelState, PanelStateMap, Vec2, ViewCommandArgs, ViewTypes } from "../types";
import { clientToOffsetPos, offsetToClientPos } from "./panelManager";

export default function useDispatchCommand() {
    const dispatch = useAppDispatch();
    const store = useAppStore();

    return useCallback((commandId: string, customParams: CustomCommandParams) => {
        const appState = store.getState();
        const appContent = selectContent(appState);

        const command = appContent.commands[commandId];
        if (!command) {
            return console.error(`Command with id "${commandId}" not found`);
        }
        
        const clientCursor = undefined;

        const baseArgs: BaseCommandArgs = {
            appState,
            clientCursor,
        };
        let actionPromise: ActionCreatorReturnType;

        if (command.scope === 'global') {
            actionPromise = command.actionCreator(baseArgs, customParams);
        } else {
            const panelManager = selectPanelManager(appState);
            const activePanelId = panelManager.activePanelId;
            const clientPanelRect = panelManager.clientRects.get(activePanelId);
            if (!clientPanelRect) {
                return console.error(`Command panel client rect not found`);
            }

            const panelsState = selectPanels(appState);
            const panelState = panelsState[command.viewType]?.[activePanelId];

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

            const viewArgs: ViewCommandArgs<PanelState> = {
                ...baseArgs,
                activePanelId,
                clientPanelRect,
                panelState,
                offsetPanelCenter, 
                clientPanelCenter,
                offsetCursor,
            };
            // @ts-ignore
            actionPromise = command.actionCreator(viewArgs, customParams);
        }
        
        actionPromise.then(resolvedReturn => {
            if (resolvedReturn == null) {
                return;
            }
            dispatch(d => {
                if (Array.isArray(resolvedReturn)) {
                    for (const action of resolvedReturn) {
                        d(action);
                    }
                } else {
                    d(resolvedReturn);
                }
            });
        });
        
    }, [ dispatch, store ]);
}
