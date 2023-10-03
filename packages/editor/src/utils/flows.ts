import * as lang from "@fluss/language";
import { JointLocationKey } from "../types";
import { FlowJointStyling } from "../types/flowRows";
import { AllRowSignatures } from "../types/flowInspectorView";
import _ from "lodash";

export function getJointLocationKey(location: lang.JointLocation): JointLocationKey {
    if (location.direction === 'input') {
        return `${location.nodeId}.${location.rowId}.${location.accessor}`;
    } else {
        return `${location.nodeId}.${location.accessor || ''}`;
    }
}

const style = (
    background:  FlowJointStyling['background'],
    border:      FlowJointStyling['border'] = 'transparent',
    shape:       FlowJointStyling['shape'] = 'round',
    borderStyle: FlowJointStyling['borderStyle'] = 'solid',
): FlowJointStyling => ({ borderStyle, shape, background, border });

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

const primitiveColors: Record<string, Pick<FlowJointStyling, 'background' | 'border'>> = {
    boolean: { background: '#44adb3', border: null, },
    number:  { background: '#347dcf', border: null, },
    string:  { background: '#9249e6', border: null, },
    // null:    { background: '#b5b5b5', border: null, },
}
const missingColor = '#b5b5b5';

function getBaseStyling(argX: lang.TypeSpecifier, env: lang.FlowEnvironment): FlowJointStyling {
    const X = lang.tryResolveTypeAlias(argX, env);

    if (X == null || X.type === 'any') {
        return style(null, '#aaa');
    }
    
    switch (X.type) {
        case 'primitive':
            return {
                ...primitiveColors[X.name],
                shape: 'round',
                borderStyle: 'solid',
            };
        case 'list':
            return {
                ...getBaseStyling(X.element, env),
                shape: 'square',
            };
    }

    return style(missingColor, null, 'square');
}

export function getJointStyling(argX: lang.TypeSpecifier, env: lang.FlowEnvironment, additional = false): FlowJointStyling {
    const baseStyle = getBaseStyling(argX, env);
    
    if (additional) {
        const borderColor = baseStyle.background || baseStyle.border || missingColor;
        return style(null, borderColor, baseStyle.shape, 'dashed');
    }

    return baseStyle;
}

type RowTypes = AllRowSignatures['rowType'];
export const flowRowTypeNames: Record<RowTypes, string> = {
    'output-simple': 'Simple Output',
    'output-destructured': 'Destructured Output',
    'output-hidden': 'Hidden Output',
    'input-simple': 'Simple Input',
    // 'input-list': 'List Input',
    'input-variable': 'Variable Input',
    // 'input-function': 'Function Input',
    // 'input-tuple': 'Tuple Input',
};

export function formatFlowLabel(label: string) {
    return label
        .split('_')
        .filter(x => x.length)
        .join('_')

    // Nicer formatting but sucks:
    // return label
    //     .split('_')
    //     .map(_.upperFirst)
    //     .join(' ');
}