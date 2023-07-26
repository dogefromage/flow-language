import { createGlobalStyle } from 'styled-components';
import 'react-reflex/styles.css';

const GlobalStyle = createGlobalStyle`

    :root {
        --color-1: #616161;
        --color-2: #333;
        --color-3: #1f1f1f;
        --color-text: #eee;
        --color-text-secondary: #929292;
        
        --box-shadow: 0 0 10px #00000033;
        
        --border-radius: 3px;
        --border-radius-top: 0 3px 3px 0;
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