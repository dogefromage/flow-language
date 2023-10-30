import React, { useEffect, useState } from 'react';
import { selectDocument, useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { ViewProps } from '../types';
import { OfflineConsumer } from '../utils/OfflineConsumer';
import ConsoleControls from './ConsoleControls';
import PanelBody from './PanelBody';
import { ConsumerOutput, ConsumerState, DocumentConsumer } from '@noodles/shared';
import ConsoleLines from './ConsoleLines';
import { PanelHeaderDiv, PanelHeadingH } from '../styles/panels';
import { consolePushLine, selectConsole } from '../slices/consoleSlice';

const ConsoleView = (viewProps: ViewProps) => {
    const dispatch = useAppDispatch();
    const console = useAppSelector(selectConsole);
    // const [lines, setLines] = useState<ConsumerOutput[]>([]);
    
    const [consumer, setConsumer] = useState<DocumentConsumer>(new OfflineConsumer());
    const [displayState, setDisplayState] = useState<string>('Loading');


    useEffect(() => {
        const handleStateChange = (nextState: ConsumerState) => {
            switch (nextState.type) {
                case 'idle':
                    setDisplayState('Idle');
                    return;
                case 'running':
                    setDisplayState('Running');
                    return;
                case 'debugging':
                    setDisplayState('Debugging');
                    return;
                case 'interrupted':
                    setDisplayState('Interrupted');
                    return;
            }
        }

        function handleOutput(output: ConsumerOutput) {
            dispatch(consolePushLine({ line: output }));
        }


        consumer.on('state-changed', handleStateChange);
        consumer.on('output', handleOutput);
        
        consumer.init();

        handleStateChange(consumer.state);

        return () => {
            consumer.off('state-changed', handleStateChange);
            consumer.off('output', handleOutput);
        }
    }, [consumer]);

    const document = useAppSelector(selectDocument);
    useEffect(() => {
        consumer.setDocument(document);
    }, [document, consumer]);

    return (
        <PanelBody viewProps={viewProps}>
            <PanelHeaderDiv>
                <PanelHeadingH>Console</PanelHeadingH>
                <ConsoleControls
                    onSignal={s => consumer.signalInput(s)}
                    state={displayState}
                />
            </PanelHeaderDiv>
            <ConsoleLines lines={console.lines} />
        </PanelBody>
    );
}

export default ConsoleView;