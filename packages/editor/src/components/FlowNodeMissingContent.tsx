import React, { PropsWithChildren } from 'react';
import { FlowNodeNameWrapper, FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';

interface FlowNodeMissingContentProps {
    signature: string;
}

export const FlowNodeMissingContent = ({ signature }: PropsWithChildren<FlowNodeMissingContentProps>) => {
    return (<>
        <FlowNodeNameWrapper
            $backColor={'#555555'}
        >
            <FlowNodeRowNameP
                $align='left'
                $bold={true}
                $color='white'
            >
                {`Unknown Node`}
            </FlowNodeRowNameP>
        </FlowNodeNameWrapper>
        <FlowNodeRowDiv>
            <FlowNodeRowNameP
                $align='left'
            >
                {`Signature="${signature}"`}
            </FlowNodeRowNameP>
        </FlowNodeRowDiv>
    </>);
}