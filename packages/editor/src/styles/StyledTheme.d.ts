// https://styled-components.com/docs/api#typescript
import { ReferenceStatus } from 'noodle-language';
import 'styled-components';
import { SelectionStatus } from '.';

declare module 'styled-components' {
    export interface DefaultTheme {
        colors: {
            general: {
                active: string;
            }
            flowEditor: {
                background: string;
                nodeColor: string;
                referenceStatus: Record<ReferenceStatus, string>;
                defaultTitle: string;
            }
            console: {
                accents: Record<ConsoleAccents, string>;
            }
            selectionStatus: {
                [ S in SelectionStatus ]?: string;
            }
        }
    }
}