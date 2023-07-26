import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

interface SizeControllerProps {

}

const SizeController = ({ children }: PropsWithChildren<SizeControllerProps>) => {

    return (
        <Div>
            { children }
        </Div>
    );
}

export default SizeController;

const Div = styled.div`
    width: 100%;
    height: 100%;
`;