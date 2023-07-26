import { useCallback, useState } from "react";

export default function () {
    const [ counter, setCounter ] = useState(0);
    return [
        counter,
        useCallback(() => setCounter(last => last + 1), [ setCounter ]),
    ] as const;
}