import { MaterialSymbol, useAppSelector, useDispatchCommand } from '@noodles/editor';
import _ from 'lodash';
import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { runtimeRunCommand, selectRuntime } from '../extensions/runtimeExtension';

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

interface RuntimeControlsProps {}

const RuntimeControls = ({ }: PropsWithChildren<RuntimeControlsProps>) => {
    const runtime = useAppSelector(selectRuntime);
    const dispatchCommand = useDispatchCommand();

    const start = '#20e680';
    const control = '#eadf4e';
    const stop = '#ed5050';

    return (<>
        <ControlsWrapper>
            <MaterialSymbol onClick={() => dispatchCommand(runtimeRunCommand)} 
                $button $color={start} $size={24}>skip_next</MaterialSymbol>
            {/* <MaterialSymbol onClick={() => emitSignal('force-run')} $button $color={start} $size={20}>warning</MaterialSymbol> */}
            {/* <MaterialSymbol $button $color={start} $size={20}>bug_report</MaterialSymbol>
            <MaterialSymbol $button $color={control} $weight={600}>step</MaterialSymbol>
            <MaterialSymbol $button $color={control} $size={22}>step_out</MaterialSymbol>
            <MaterialSymbol $button $color={control} $size={22}>step_into</MaterialSymbol> */}
            {/* <MaterialSymbol onClick={() => emitSignal('abort')} $button $color={stop} $size={20} >block</MaterialSymbol> */}
            <p>{ _.capitalize(runtime.activeRuntime?.state || 'No runtime loaded') }</p>
        </ControlsWrapper>
    </>);
}

export default RuntimeControls;