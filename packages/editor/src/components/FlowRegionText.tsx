import React, { PropsWithChildren, useRef, useState } from 'react';
import * as lang from '@noodles/language';
import { useAppDispatch } from '../redux/stateHooks';
import { flowsSetRegionAttribute } from '../slices/flowsSlice';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

interface FlowRegionTextProps {
    flowId: string;
    region: lang.FlowRegion;
}

const FlowRegionText = ({ flowId, region }: PropsWithChildren<FlowRegionTextProps>) => {
    const dispatch = useAppDispatch();
    const [writeAction, setWriteAction] = useState<string | undefined>();
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const onChange = (e: React.ChangeEvent) => {
        const newValue = (e.currentTarget as HTMLTextAreaElement).value;
        dispatch(flowsSetRegionAttribute({
            flowId,
            regionId: region.id,
            key: 'text',
            value: newValue,
            undo: {
                desc: 'Updated text on region.',
                actionToken: writeAction,
            },
        }));
    }

    const onStartWriting = (e: React.MouseEvent) => {
        setWriteAction(uuidv4());
        setTimeout(() => {
            textAreaRef.current?.focus();
            textAreaRef.current?.select();
        }, 100);
    }

    return (
        writeAction ? (
            <RegionTextArea value={region.attributes.text} onChange={onChange}
                ref={textAreaRef}
                onBlur={() => setWriteAction(undefined)}
                onDoubleClick={e => e.stopPropagation()} 
                // onWheel={e => e.stopPropagation()}    
            />
        ) : (
            <RegionTextPara onClick={onStartWriting}>
                {region.attributes.text || ''}
            </RegionTextPara>
        )
    );
}

export default FlowRegionText;

const RegionTextArea = styled.textarea`
    width: 100%;
    height: 100%;
    font-family: inherit;
    font-size: 16px;
    background-color: transparent;
    border: none;
    outline: none;
    resize: none;
`;

const RegionTextPara = styled.p`
    height: 100%;
    overflow: hidden;
    white-space: break-spaces;
`;