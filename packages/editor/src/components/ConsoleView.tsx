import React, { useEffect, useState } from 'react';
import { selectDocument, useAppSelector } from '../redux/stateHooks';
import { PanelHeaderDiv, PanelHeadingH } from '../styles/common';
import { ViewProps } from '../types';
import { OfflineConsumer } from '../utils/OfflineConsumer';
import ConsoleControls from './ConsoleControls';
import PanelBody from './PanelBody';
import { ConsumerOutput, ConsumerState, DocumentConsumer } from '@noodles/shared';
import ConsoleLines from './ConsoleLines';

const ConsoleView = (viewProps: ViewProps) => {
    const [consumer, setConsumer] = useState<DocumentConsumer>(new OfflineConsumer());
    const [lines, setLines] = useState<ConsumerOutput[]>([]);
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

        const handleOutput = (output: ConsumerOutput) => {
            setLines(last => [...last, output]);
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
            <ConsoleLines lines={lines} />
        </PanelBody>
    );
}

export default ConsoleView;