import { DefaultTheme } from "styled-components";
import { SelectionStatus } from "../types";

const defaultTheme: DefaultTheme = {
    colors: {
        general: {
            active: '#dd2255',
        },
        flowEditor: {
            background: '#444',
            nodeColor: 'var(--color-3)',
            edgeColors: {
                normal: '#c9c9c9',
                redundant: '#c9c9c944',
                cyclic: '#ba2a09',
            },
            defaultTitle: '#111',
        },
        console: {
            accents: {
                error: '#ed5050',
                warn: '#eadf4e'
            }
        },
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
        selectionStatus: {
            [SelectionStatus.Selected]:        '#c4a149',
            [SelectionStatus.SelectedForeign]: '#4ae7df55',
        }
    },
};

export default defaultTheme;