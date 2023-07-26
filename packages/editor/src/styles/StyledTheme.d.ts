// https://styled-components.com/docs/api#typescript
import 'styled-components';
import { DataTypes, SelectionStatus } from '.';
import { EdgeColor } from '@marble/language';

declare module 'styled-components' {
    export interface DefaultTheme {
        colors: {
            general: {
                fields: string;
                errorOverlay: string;
                active: string;
            }
            flowEditor: {
                background: string;
                nodeColor: string;
                edgeColors: Record<EdgeColor, string>;
                defaultTitle: string;
            }
            dataTypes: Record<string, string>;
            selectionStatus: {
                [ S in SelectionStatus ]?: string;
            }
        }
    }
}