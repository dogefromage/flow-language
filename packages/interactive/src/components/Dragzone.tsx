import React from 'react';
import ReactDOM from 'react-dom';

interface Props {
    cursor?: string
}

export const Dragzone = (props: React.HTMLAttributes<HTMLDivElement> & Props) => {
    return ReactDOM.createPortal(
        <div
            {...props}
            style={{
                transform: 'initial',
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 1000,
                cursor: props.cursor,
            }}
        />,
        document.querySelector(`#dragzone-portal-mount`)!
    );
};