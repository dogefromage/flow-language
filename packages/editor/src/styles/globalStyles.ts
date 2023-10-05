import { createGlobalStyle } from 'styled-components';
import 'react-reflex/styles.css';

const GlobalStyle = createGlobalStyle`
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap');
    /* @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300'); */

    :root {
        --color-1: #616161;
        --color-2: #333;
        --color-3: #1f1f1f;
        --color-4: #131313;
        --color-text: #eee;
        --color-text-secondary: #929292;
        
        --box-shadow: 3px 3px 8px #00000033;

        --border-radius: 3px;
        --border-radius-top: 0 3px 3px 0;

        --list-gap: 4px;
        --list-height: 30px;

        font-family: 'Fira Code', monospace;
    }

    body {
        background-color: #330033;
    }

    * {
        padding: 0;
        margin: 0;
        box-sizing: border-box;

        user-select: none;

        color: var(--color-text);
    }

    a {
        color: inherit;
        text-decoration: none;
    }

    input, button {
        font-family: inherit;
        font-size: inherit;
    }
`;

export default GlobalStyle;