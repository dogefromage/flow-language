import { PropsWithChildren, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ConsoleLine } from '../types';
import { useAppSelector } from '../redux/stateHooks';
import { selectConsole } from '../slices/consoleSlice';

const ConsoleDiv = styled.div`
    width: 100%;
    height: 100%;

    padding: 0.25rem 0.5rem;

    display: inline;
    overflow-y: scroll;
    overflow-x: hidden;
    
    background-color: var(--color-4);
`;

const ConsolePre = styled.pre<{ $accent?: ConsoleLine['accent'] }>`
    display: inline;
    font-size: 18px;
    font-family: monospace;
    user-select: text;
    white-space: break-spaces;
    word-break: break-word;

    ${({ $accent, theme }) => $accent && `
        color: ${theme.colors.console.accents[$accent]};
    ` }
`;

interface ConsoleLinesProps {}

const ConsoleLines = ({}: PropsWithChildren<ConsoleLinesProps>) => {
    const { lines } = useAppSelector(selectConsole);

    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setTimeout(() => {
            const d = scrollRef.current;
            if (!d) return;
            d.scrollTop = d.scrollHeight;
        }, 10);
    }, [ lines ]);

    return (
        <ConsoleDiv ref={scrollRef}>
            {lines.map((l, index) =>
                <ConsolePre 
                    key={index + '.' + l.text} 
                    $accent={l.accent}>
                        {l.text}
                </ConsolePre>
            )}
        </ConsoleDiv>
    );
}

export default ConsoleLines;