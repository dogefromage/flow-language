import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { contextMenuClose, selectContextMenu } from '../slices/contextMenuSlice';
import Menus from './Menus';

const CONTEXT_MENU_ID = `context_menu`;
export const CONTEXT_MENU_DIVIDER = 'divider';

const ContextMenu = () => {
    const dispatch = useAppDispatch();
    const { contextMenu } = useAppSelector(selectContextMenu);

    if (!contextMenu) return null;

    return (
        <Menus.RootFloating menuId={CONTEXT_MENU_ID} anchor={contextMenu.clientCursor}
            onClose={() => dispatch(contextMenuClose())}> {
                contextMenu.commandIds.map((commandId, index) =>
                    commandId === CONTEXT_MENU_DIVIDER ? (
                        <Menus.Divider key={'divider' + index} />
                    ) : (
                        <Menus.Command key={commandId + index} commandId={commandId} params={contextMenu.paramMap} />
                    )
                )
            }
        </Menus.RootFloating>
    );
}

export default ContextMenu;