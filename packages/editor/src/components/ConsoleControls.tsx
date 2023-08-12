import { ConsumerInputSignal } from '@fluss/shared';
import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';
import MaterialSymbol from '../styles/MaterialSymbol';

const ControlsWrapper = styled.div`
    outline: 1px solid var(--color-1);
    outline-offset: 2px;

    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: var(--border-radius);

    .material-symbols-outlined {
        width: 22px;
    }
`;

interface ConsoleControlsProps {
    onSignal: (signal: ConsumerInputSignal) => void;
    state: string;
}

const ConsoleControls = ({ onSignal, state }: PropsWithChildren<ConsoleControlsProps>) => {

    const start = '#20e680';
    const control = '#eadf4e';
    const stop = '#ed5050';

    // const 

    return (<>
        <ControlsWrapper>
            <MaterialSymbol onClick={() => onSignal('run')} $button $color={start} $size={24}>skip_next</MaterialSymbol>
            <MaterialSymbol onClick={() => onSignal('force-run')} $button $color={start} $size={20}>warning</MaterialSymbol>
            {/* <MaterialSymbol $button $color={start} $size={20}>bug_report</MaterialSymbol>
            <MaterialSymbol $button $color={control} $weight={600}>step</MaterialSymbol>
            <MaterialSymbol $button $color={control} $size={22}>step_out</MaterialSymbol>
            <MaterialSymbol $button $color={control} $size={22}>step_into</MaterialSymbol> */}
            <MaterialSymbol onClick={() => onSignal('abort')} $button $color={stop} $size={20} >block</MaterialSymbol>
            <p>{ state }</p>
        </ControlsWrapper>
    </>);
}

export default ConsoleControls;