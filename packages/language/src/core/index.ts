import { ArgumentRowState, ParameterSignature, RowDisplay } from "../types";
import { TExpr } from "../typesystem/typeExpr";

const initializableConstantTypes = ['string', 'number', 'boolean'];

// export function getArgRowDisplay(
//     argRow: ArgumentRowState,
//     // argRowSignature?: ArgumentSignature,
//     argType?: TExpr
// ): RowDisplay {

//     if (argType) {
//         const shouldDestructure = argRow.destructure
//             /* ?? argRowSignature?.destructure */ ?? false;
//         if (argType.kind === 'RECORD' && shouldDestructure) {
//             return 'destructured';
//         }
    
//         if (argType.kind === 'CONST' &&
//             initializableConstantTypes.includes(argType.name)) {
//             return 'initializer';
//         }
//     }

//     return 'simple';
// }