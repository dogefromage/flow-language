import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { FLOW_NODE_ROW_HEIGHT } from '../styles/flowStyles';
import _ from 'lodash';

const SlidableInputDiv = styled.div`
    position: relative;
    width: 100%;
    height: ${FLOW_NODE_ROW_HEIGHT * 0.8}px;
    display: flex;
    align-items: center;

    form, input {
        width: 100%;
        height: 100%;

        position: absolute;

        left: 0;
        top: 0;
    }
    
    form {
        input {
            padding: 0 0.5em;
            box-shadow: var(--box-shadow);
            background-color: var(--color-1);
            border: none;
            text-align: right;
            font-weight: bold;
            font-size: 14px;

            &:focus
            {
                text-align: center;
            }

            border-radius: var(--border-radius);
        }
    }
    
    .name {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        left: 0.5rem;

        margin: 0;

        pointer-events: none;
        font-size: 16px;

        width: 60%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
`;

function formatShort(text: string) {
    return `"${_.truncate(text, { length: 8 })}"`;
}

type Props = {
    value: string;
    onChange: (newValue: string) => void;
    name?: string;
}

const FormTextInput = ({
    value,
    onChange,
    name,
}: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isWriting, setIsWriting] = useState(false);
    const [textValue, setTextValue] = useState<string>();

    const submitText = (e: React.FormEvent) => {
        e.preventDefault();

        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setIsWriting(false);
        onChange(inputRef.current?.value || '');
    };

    const startWriting = (e: React.MouseEvent | React.FocusEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsWriting(true);
        setTextValue(value);
        inputRef.current?.focus();
        setTimeout(() => inputRef.current?.select(), 0);
    }

    // const dragRef = useRef({
    //     startX: 0,
    //     startVal: 0,
    //     actionToken: '',
    //     ctrl: false,
    //     shift: false,
    // });

    // const { handlers, catcher } = useMouseDrag({
    //     mouseButton: 0,
    //     start: e => {
    //         dragRef.current = {
    //             startX: e.clientX,
    //             startVal: value,
    //             actionToken: 'drag_slidable_input.' + uuidv4(),
    //             shift: e.shiftKey,
    //             ctrl: e.ctrlKey,
    //         }

    //         e.stopPropagation();
    //         e.preventDefault();
    //     },
    //     move: e => {
    //         const rate = dragRef.current.shift ? 0.01 : 0.1;

    //         let value =
    //             dragRef.current.startVal +
    //             rate * (e.clientX - dragRef.current.startX);

    //         if (dragRef.current.ctrl) value = Math.round(value);

    //         onChange(value, dragRef.current.actionToken);
    //     }
    // }, {
    //     deadzone: 3,
    //     cursor: 'ew-resize',
    // });

    return (
        <SlidableInputDiv>
            <form onSubmit={submitText}>
                <input
                    ref={inputRef}
                    type='text'
                    value={isWriting ? textValue : formatShort(value)}
                    onChange={e => {
                        setTextValue((e.currentTarget as HTMLInputElement).value);
                    }}
                    // {...handlers}
                    // onMouseUp={e => {
                    //     startWriting(e);
                    //     // handlers.onMouseUp(e);
                    // }}
                    onFocus={e => startWriting(e)}
                    onBlur={submitText}
                    autoComplete='off'
                    autoCorrect='off'
                    autoSave='off'
                />
            </form>
            {/* {catcher} */}
            {
                !isWriting && name &&
                <p className='name'>{name}</p>
            }
        </SlidableInputDiv>
    )
}

export default FormTextInput