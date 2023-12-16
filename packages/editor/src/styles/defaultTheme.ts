import { DefaultTheme } from "styled-components";

const defaultTheme: DefaultTheme = {
    colors: {
        general: {
            active: '#dd2255',
        },
        flowEditor: {
            background: '#444',
            nodeColor: 'var(--color-3)',
            referenceStatus: {
                normal: '#c9c9c9',
                redundant: '#c9c9c944',
                cyclic: '#ba2a09',
                illegal: '#ba2a09',
            },
            defaultTitle: '#111',
        },
        console: {
            accents: {
                error: '#ed5050',
                warning: '#eadf4e'
            }
        },
        selectionStatus: {
            selected: '#c4a149',
        }
    },
};

export default defaultTheme;