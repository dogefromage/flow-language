import { RowContext } from '@fluss/language';
import React, { ReactNode, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { FlowNodeRowDiv } from '../styles/flowStyles';

const ErrorUnderlineSpan = styled.span<{ $hasErrors: boolean, $debugBackColor?: string }>`

    ${({ $debugBackColor: debugBackColor }) => debugBackColor && css`
        &>div {
            background-color: ${debugBackColor};
        }
    `}

    ${({ $hasErrors: hasErrors, theme }) => hasErrors && css`
        position: relative;

        p {
            /* background-color: ${theme.colors.general.errorOverlay}; */
            /* text-decoration: underline overline red; */
            text-decoration: red wavy underline;
            /* font-style: italic; */
            /* text-underline-position: auto; */
        }

        .error-tooltip {
            position: absolute;
            visibility: hidden;
            width: 120px;
            background-color: black;
            color: #fff;
            text-align: center;
            padding: 5px 0;
            border-radius: 6px;
            z-index: 1;
            top: -5px;
            left: 105%;
        }

        &:hover .error-tooltip {
            visibility: visible;
        }
    `}
`;

interface Props {
    context: RowContext | undefined;
    children: ReactNode;
}

const FlowNodeRow = ({ context, children }: Props) => {
    const hasErrors = !!context?.problems.length;

    // const [color, setColor] = useState('#ffffff');
    // useEffect(() => {
    //     // console.log(`ROW UPDATE ${row.id}`);
    //     setColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
    // }, [context])

    return (
        <ErrorUnderlineSpan
            $hasErrors={hasErrors}
            onMouseEnter={(hasErrors) => {
                // hasErrors && console.log(context?.problems);
            }}
            // debugBackColor={color}
        >
            <FlowNodeRowDiv>
                {children}
            </FlowNodeRowDiv>
            <span className='error-tooltip'>{context?.problems[0]?.type}</span>
        </ErrorUnderlineSpan>
    );
}

export default FlowNodeRow;
