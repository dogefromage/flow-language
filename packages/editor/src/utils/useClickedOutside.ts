import { useEventListener } from "./useEventListener";

export default function useClickedOutside(ref: React.RefObject<HTMLElement>, cb: () => void) {
    const handler = (e: Event) => {
        if (!ref.current?.contains(e.target as Node)) {
            cb();
        }
    }
    useEventListener('mousedown', handler, document);
    useEventListener('wheel', handler, document);
}
