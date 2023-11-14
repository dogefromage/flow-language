import { AppDispatch, RootState } from '../redux/rootReducer';
import { PanelState } from './panelManager';
import { Rect, Vec2 } from './utils';

export interface KeyCombination {
    key: string;
    displayName?: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
}

export type CommandScope = 'global' | 'view';

export interface BaseCommandParams {
    appState: RootState;
    clientCursor?: Vec2;
}

export interface ViewCommandParams<P extends PanelState = PanelState> extends BaseCommandParams {
    activePanelId: string;
    clientPanelRect: Rect;
    panelState: P;
    offsetPanelCenter: Vec2;
    clientPanelCenter: Vec2;
    offsetCursor?: Vec2;
}

export type CustomCommandParams = { [key: string]: any } & {
    clientCursor?: Vec2;
    activePanelId?: string;
}

export type AppAction = Parameters<AppDispatch>[0];

type GlobalCommandActionCreator = (baseArgs: BaseCommandParams, 
    customParams: CustomCommandParams) => AppAction[] | AppAction | void;
type ViewCommandActionCreator<P extends PanelState = PanelState> = (baseArgs: ViewCommandParams<P>, 
    customParams: CustomCommandParams) => AppAction[] | AppAction | void;

interface BaseCommand {
    id: string;
    name: string;
    keyCombinations?: KeyCombination[];
}
interface GlobalCommand extends BaseCommand {
    scope: 'global',
    actionCreator: GlobalCommandActionCreator;
}
interface ViewCommand extends BaseCommand {
    scope: 'view',
    viewType: string;
    actionCreator: ViewCommandActionCreator;
}

export type Command = GlobalCommand | ViewCommand;

export const createGlobalCommand = (id: string, name: string, 
        actionCreator: GlobalCommand['actionCreator'], 
        keyCombinations?: KeyCombination[]): GlobalCommand =>
    ({ id, scope: 'global', name, actionCreator, keyCombinations });

export const createViewCommand = <P extends PanelState>
    (id: string, viewType: string, name: string, actionCreator: ViewCommandActionCreator<P>, 
        keyCombinations?: KeyCombination[]): ViewCommand =>
    ({ id, scope: 'view', viewType, name, keyCombinations,
        actionCreator: actionCreator as ViewCommandActionCreator });