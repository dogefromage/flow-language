import { KeyCombination } from "../types";

export function matchesKeyCombination(
    keyCombination: KeyCombination,
    event: KeyboardEvent
) {
    if (keyCombination.key.toLowerCase() !== event.key.toLowerCase()) return false;

    const altKey = keyCombination.altKey || false;
    const ctrlKey = keyCombination.ctrlKey || false;
    const shiftKey = keyCombination.shiftKey || false;

    if (altKey !== event.altKey) return false;
    if (ctrlKey !== event.ctrlKey) return false;
    if (shiftKey !== event.shiftKey) return false;

    return true;
}

export function formatKeyCombination(combination: KeyCombination) {
    const tags = [] as string[];

    if (combination.ctrlKey) tags.push('Ctrl');
    if (combination.altKey) tags.push('Alt');
    if (combination.shiftKey) tags.push('Shift');

    const key = combination.displayName || combination.key;
    const firstLetterUppercase = key.charAt(0).toUpperCase() + key.slice(1);
    tags.push(firstLetterUppercase);

    return tags.join('+');
}