import React, { PropsWithChildren } from 'react';
import { FlowNodeNameWrapper, FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';
import * as lang from '@noodles/language';

interface FlowNodeMissingContentProps {
    signaturePath: lang.NamespacePath;
}

export const FlowNodeMissingContent = ({ signaturePath }: PropsWithChildren<FlowNodeMissingContentProps>) => {
    return (<>
        <FlowNodeNameWrapper $backColor={'#555555'}>
            <FlowNodeRowNameP $align='left' $bold={true} $color='white'>
                {`Unknown Node`}
            </FlowNodeRowNameP>
        </FlowNodeNameWrapper>
        <FlowNodeRowDiv>
            <FlowNodeRowNameP $align='left'>
                {`Signature: ${signaturePath.path}`}
            </FlowNodeRowNameP>
        </FlowNodeRowDiv>
    </>);
}