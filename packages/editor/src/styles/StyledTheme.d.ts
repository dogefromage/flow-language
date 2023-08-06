// https://styled-components.com/docs/api#typescript
import 'styled-components';
import { DataTypes, SelectionStatus } from '.';
import { EdgeColor } from '@marble/language';
import { TypeSpecifier } from '@fluss/language';

export interface JointStyle {
    color: string;
    fill: boolean;
}

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
            jointStyles: Record<string, {
                borderColor: string;
                fillColor: string;
            }>;
            selectionStatus: {
                [ S in SelectionStatus ]?: string;
            }
        }
    }
}