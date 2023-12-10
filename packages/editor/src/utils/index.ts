import { consolePushLine } from "../slices/consoleSlice";
import { ColorTuple, Rect } from "../types";

export function assert<T>(condition: T, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

export class AppException extends Error {}

export function except(message: string): never {
    throw new AppException(message);
}

export function createConsoleError(e: Error) {
    return consolePushLine({
        line: {
            text: `${e.message || 'An unknown error occured.'}\n`,
            accent: 'error',
        }
    });
}
export function createConsoleWarn(msg: string) {
    return consolePushLine({
        line: {
            text: `${msg}\n`,
            accent: 'warning',
        }
    });
}

export function maybe<T>(t: T) {
    return t as T | undefined;
}

export function interlace<T>(arr: T[], spacer: T) {
    const newArr: T[] = [];
    for (let i = 0; i < arr.length; i++) {
        if (i > 0) {
            newArr.push(spacer);
        }
        newArr.push(arr[i]);
    }
    return newArr;
}

export function clamp(t: number, min = 0, max = 1) {
    return Math.max(min, Math.min(t, max));
}

export function degToRad(degs: number) {
    return degs * Math.PI / 180;
}

// https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
export function isIntegerString(str: any) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

export function rectanglesIntersect(a: Rect, b: Rect) { 
    return (
        a.x < b.x+b.w && a.x+a.w > b.x &&
        a.y < b.y+b.h && a.y+a.h > b.y
    );
}

const MAX_NUMERICAL_INPUT_VALUE = 1e32;

export function formatNumericalInput(value: number) {
    if (typeof value !== 'number' ||
        !isFinite(value)) return 'NaN';

    let precision = value.toPrecision(4);
    let string = value.toString();
    return precision.length > string.length ? string : precision;
}

export function parseNumericalInput(input: string) {

    // TODO: https://www.npmjs.com/package/mathjs?activeTab=readme
    const evaluatedString = eval(input);

    let numberValue = clamp(Number.parseFloat(evaluatedString), -MAX_NUMERICAL_INPUT_VALUE, MAX_NUMERICAL_INPUT_VALUE);
    if (!isFinite(numberValue)) throw new Error(`Input value is not finite`);
    return numberValue;
}

export function trueMod(x: number, m: number) {
    return ((x % m) + m) % m;
}

export function colorTupleToHex(rgb: ColorTuple) {

    const hexLiterals = rgb.map(dec => {
        const intCol = Math.floor(255 * dec);
        return intCol.toString(16).padStart(2, '0');
    });
    return `#${hexLiterals.join('')}`;
}

export function hexToColorTuple(hex: string): ColorTuple {
    const match = hex.match(/^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i);
    if (!match) {
        throw new Error(`Input ${hex} is not hex color`);
    }
    const [ _, r, g, b ] = match;
    const tuple = [ r, g, b ].map(v => parseInt(v, 16) / 255.0);
    return tuple as ColorTuple;
}