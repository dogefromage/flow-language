import { clamp } from "./math";

const MAX_VALUE = 1e32;

export function formatSimple(value: number) {
    if (typeof value !== 'number' ||
        !isFinite(value)) return 'NaN';

    let precision = value.toPrecision(4);
    let string = value.toString();
    return precision.length > string.length ? string : precision;
}

export function parseSimple(input: string) {

    // replace with https://www.npmjs.com/package/mathjs?activeTab=readme
    const evaluatedString = eval(input);

    let numberValue = clamp(Number.parseFloat(evaluatedString), -MAX_VALUE, MAX_VALUE);
    if (!isFinite(numberValue)) throw new Error(`Input value is not finite`);
    return numberValue;
}
