import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.scss'

try {
    // @ts-ignore
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
} catch {}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

