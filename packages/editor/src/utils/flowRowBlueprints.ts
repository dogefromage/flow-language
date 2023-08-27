import * as lang from '@fluss/language';
import { formatSpecifier } from './typeFormatting';
import { AllRowSignatures, FlowPortLists, RowSignatureBlueprint } from '../types/flowInspectorView';


// function getBlueprintKey(bp: RowSignatureBlueprint): string {
//     if (typeof bp.specifier === 'string') {
//         return `${bp.rowType}:${bp.specifier}`;
//     } else if (bp.specifier.type === 'list') {
//         return `${bp.rowType}:${bp.specifier.type}:${bp.specifier.element}`;
//     }
//     console.error(`Unknown blueprint`);
//     return '';
// }

// export function generateBlueprints(portType: FlowPortLists, env?: lang.FlowEnvironment) {
//     const blueprints: Record<string, RowSignatureBlueprint> = {};
//     const blueprintOptions: string[] = [];
//     const blueprintNames: Record<string, string> = {};

//     if (env) {
//         const mentionedSpecifiers = lang.getAllReferencedSpecifiers(env);
//         console.log(mentionedSpecifiers);

//         for (const baseSpecifier of mentionedSpecifiers) {
//             for (const rowType of rowTypesOfDirection[portType]) {
//                 let specifier = baseSpecifier;
//                 if (rowType === 'input-list') {
//                     specifier = lang.createListType(baseSpecifier);
//                 }
//                 const blueprint = { rowType, specifier };
//                 const key = getBlueprintKey(blueprint);
//                 blueprintOptions.push(key);
//                 blueprints[key] = blueprint;
//                 const formattedName = formatSpecifier(baseSpecifier, env);
//                 blueprintNames[key] = `${formattedName} - ${rowTypesNames[rowType]}`;
//             }
//         }
//     }

//     return { blueprints, blueprintOptions, blueprintNames };
// }
