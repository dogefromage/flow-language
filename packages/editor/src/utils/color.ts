import { FlowEnvironment, TypeSpecifier } from "@fluss/language";
import { ColorTuple } from "../types";
import * as lang from '@fluss/language';
import { FlowJointStyling } from "../types/flowRows";

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



export function getTypeSpecifierStyleTag(X: TypeSpecifier, env: FlowEnvironment) {
    X = lang.tryResolveTypeAlias(X, env)!;
    if (X == null) {
        return 'unknown';
    }
    if (X.type === 'primitive') {
        return X.name;
    }
    return X.type;
}

export function getJointStyling(X: TypeSpecifier, env: FlowEnvironment, additional = false): FlowJointStyling {
    return {
        borderStyle: 'dashed'           , 
        shape: 'square',
        background: 'transparent',
        border: 'red',
    };
    // jointStyles: {
    //     boolean:   { fillColor: '#44adb3', borderColor: 'transparent' },
    //     number:    { fillColor: '#347dcf', borderColor: 'transparent' },
    //     string:    { fillColor: '#9249e6', borderColor: 'transparent' },
    //     any:       { fillColor: 'transparent', borderColor: '#aaa' },
    //     missing:   { fillColor: 'transparent', borderColor: '#aaa' },
    //     function:  { fillColor: '#ff55ff', borderColor: 'transparent' },
    //     map:       { fillColor: '#ff55ff', borderColor: 'transparent' },
    //     list:      { fillColor: '#ff55ff', borderColor: 'transparent' },
    //     tuple:     { fillColor: '#ff55ff', borderColor: 'transparent' },
    // },
}