import { AnyAction, AsyncThunkAction } from '@reduxjs/toolkit';
import { PanelState, PanelStateMap, ViewTypes } from './panelManager';
import { Rect, Vec2 } from './utils';
import { AppDispatch, RootState } from '../redux/rootReducer';

export interface KeyCombination {
    key: string;
    displayName?: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
}

export type CommandScope = 'global' | 'view';

export interface BaseCommandArgs {
    appState: RootState;
    clientCursor?: Vec2;
}

export interface ViewCommandArgs<P extends PanelState> extends BaseCommandArgs {
    activePanelId: string;
    clientPanelRect: Rect;
    panelState: P;
    offsetPanelCenter: Vec2;
    clientPanelCenter: Vec2;
    offsetCursor?: Vec2;
}

export type CustomCommandParams = { [key: string]: any }

export type AppAction = Parameters<AppDispatch>[0];

interface BaseCommand {
    id: string;
    name: string;
    keyCombinations?: KeyCombination[];
}
interface GlobalCommand extends BaseCommand {
    scope: 'global',
    actionCreator: (baseArgs: BaseCommandArgs, customParams: CustomCommandParams) => AppAction[] | AppAction | void;
}
interface ViewCommand<V extends ViewTypes, P extends PanelState = PanelStateMap[V]> extends BaseCommand {
    scope: 'view',
    viewType: V;
    actionCreator: (baseArgs: ViewCommandArgs<P>, customParams: CustomCommandParams) => AppAction[] | AppAction | void;
}

export type Command = 
    | GlobalCommand
    | { [ V in ViewTypes ]: ViewCommand<V> }[ ViewTypes ];

export const makeGlobalCommand = (id: string, name: string, 
        actionCreator: GlobalCommand['actionCreator'], 
        keyCombinations?: KeyCombination[]): GlobalCommand =>
    ({ id, scope: 'global', name, actionCreator, keyCombinations });

export const makeViewCommand = <V extends ViewTypes, P extends PanelState = PanelStateMap[V]>
    (id: string, viewType: V, name: string, actionCreator: ViewCommand<V, P>['actionCreator'], 
        keyCombinations?: KeyCombination[]): ViewCommand<V, P> =>
    ({ id, scope: 'view', viewType, name, actionCreator, keyCombinations });