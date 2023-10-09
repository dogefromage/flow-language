// https://styled-components.com/docs/api#typescript
import { ConsumerOutput } from '@noodles/shared';
import { EdgeColor } from '@marble/language';
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
                edgeColors: Record<EdgeColor, string>;
                defaultTitle: string;
            }
            console: {
                accents: Record<ConsumerOutput['accent'], string>;
            }
            selectionStatus: {
                [ S in SelectionStatus ]?: string;
            }
        }
    }
}