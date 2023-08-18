import * as lang from '@fluss/language';
import React, { PropsWithChildren, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { FlowNodeRowDiv } from '../styles/flowStyles';
import FlowNodeRowContextToolTip from './FlowNodeRowContextToolTip';
import useHover from '../utils/useHover';
import { RowComponentProps } from './FlowNodeRowComponents';

const ErrorUnderlineDiv = styled.div<{ $hasErrors: boolean, $debugBackColor?: string }>`
    position: relative;

    ${({ $debugBackColor: debugBackColor }) => debugBackColor && css`
        &>div {
            background-color: ${debugBackColor};
        }
    `}

    ${({ $hasErrors }) => $hasErrors && css`
        --error-deco: red wavy underline;
        /* p {
        } */
    `}
`;

const FlowNodeRow = (props: PropsWithChildren<RowComponentProps>) => {
    const { context, children } = props;
    const hasErrors = !!context?.problems.length;

    // const [color, setColor] = useState('#ffffff');
    // useEffect(() => {
    //     // console.log(`ROW UPDATE ${row.id}`);
    //     setColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
    // }, [context])

    const { handlers, hovering } = useHover(700);

    return (
        <ErrorUnderlineDiv
            $hasErrors={hasErrors}
            // onMouseEnter={(hasErrors) => {
                // hasErrors && console.log(context?.problems);
            // }}
            {...handlers}
        >
            <FlowNodeRowDiv>
                {children}
            </FlowNodeRowDiv>
            {
                hovering &&
                <FlowNodeRowContextToolTip {...props} />
            }
        </ErrorUnderlineDiv>
    );
}

export default FlowNodeRow;
