import { Rect } from "../types";

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

export function getBasePowers(x: number, base: number) {
    if (base <= 1) {
        throw new Error(`Invalid base`);
    }
    if (x === 0) return [ 0 ];
    const result: number[] = [];
    while (x > 0) {
        let remainder = x % base;
        result.push(remainder);
        x = (x - remainder) / base;
    }
    return result;
}