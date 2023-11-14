import { useEffect } from 'react';
import { useAppStore } from '../redux/stateHooks';
import { selectConfig } from '../slices/configSlice';
import { matchesKeyCombination } from '../utils/keyCombinations';
import useDispatchCommand from '../utils/useDispatchCommand';

const KeyboardCommandListener = () => {
    const dispatchCommand = useDispatchCommand();
    const store = useAppStore();

    useEffect(() => {

        function onKey(e: KeyboardEvent) {
            if (document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement) {
                return;
            }

            const commands = selectConfig(store.getState());

            for (const command of Object.values(commands.commands || {})) {
                for (const combination of command.keyCombinations || []) {
                    if (matchesKeyCombination(combination, e)) {
                        e.preventDefault();
                        dispatchCommand(command.id, {});
                        return;
                    }
                }
            }
        }

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);

    }, []);

    return null;
}

export default KeyboardCommandListener;