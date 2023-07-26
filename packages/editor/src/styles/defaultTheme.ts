import { DefaultTheme } from "styled-components";
import { SelectionStatus } from "../types";

const defaultTheme: DefaultTheme = {
    colors: {
        general: {
            fields: '#d7d7d7',
            errorOverlay: '#ff000022',
            active: '#dd2255',
        },
        flowEditor: {
            background: '#444',
            nodeColor: 'var(--color-2)',
            edgeColors: {
                normal: '#c9c9c9',
                redundant: '#c9c9c944',
                cyclic: '#ba2a09',
            },
            defaultTitle: '#c5c5c5',
        },
        dataTypes: {
            'boolean': '#44adb3',
            'number': '#347dcf',
            'string': '#9249e6',
        },
        selectionStatus: {
            [SelectionStatus.Selected]:        '#c4a149',
            [SelectionStatus.SelectedForeign]: '#4ae7df55',
        }
    },
};

export default defaultTheme;