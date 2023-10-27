import { useEffect, useRef } from 'react';
import { useDirectRef } from './useDirectRef';

export function useEventListener<K extends keyof DocumentEventMap>(event: K, cb: (e: DocumentEventMap[ K ]) => void, target: Document) {
    const cbRef = useDirectRef(cb);

    useEffect(() => {
        const handler = (e: DocumentEventMap[ K ]) => cbRef.current?.(e);
        target.addEventListener(event, handler);
        return () => target.removeEventListener(event, handler);
    }, [ event, target, cbRef ]);
}