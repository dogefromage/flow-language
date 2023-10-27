import { useCallback, useRef } from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { selectContent } from '../slices/contentSlice';
import { matchesKeyCombination } from '../utils/keyCombinations';
import useDispatchCommand from '../utils/useDispatchCommand';
import { useEventListener } from '../utils/useEventListener';

const KeyboardCommandListener = () => {
    const dispatchCommand = useDispatchCommand();
    const { commands } = useAppSelector(selectContent);

    const commandsRef = useRef(commands);
    commandsRef.current = commands;

    const handler = useCallback((e: KeyboardEvent) => {
        if (document.activeElement instanceof HTMLInputElement)
            return;

        for (const _command of Object.values(commands)) {
            const command = _command!; // is def.

            if (!command.keyCombinations) continue;

            for (const combination of command.keyCombinations) {
                if (matchesKeyCombination(combination, e)) {
                    dispatchCommand(command.id, {});
                    e.preventDefault();
                }
            }
        }
    }, [ dispatchCommand ]);

    useEventListener('keydown', handler, document);

    return null;
}

export default KeyboardCommandListener;