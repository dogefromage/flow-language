// https://styled-components.com/docs/api#typescript
import 'styled-components';
import { DataTypes, SelectionStatus } from '.';
import { EdgeColor } from '@marble/language';
import { TypeSpecifier } from '@fluss/language';
import { ConsumerOutput } from '@fluss/shared';

export interface JointStyle {
    color: string;
    fill: boolean;
}

declare module 'styled-components' {
    export interface DefaultTheme {
        colors: {
            general: {
                active: string;
            }
            flowEditor: {
                background: string;
                nodeColor: string;
                edgeColors: Record<EdgeColor, string>;
                defaultTitle: string;
            }
            console: {
                accents: Record<ConsumerOutput['accent'], string>;
            }
            // jointStyles: Record<string, {
            //     borderColor: string;
            //     fillColor: string;
            // }>;
            selectionStatus: {
                [ S in SelectionStatus ]?: string;
            }
        }
    }
}