import React, { PropsWithChildren, useMemo } from 'react';
import * as SORTABLE from 'react-sortablejs';
import styled from 'styled-components';
import MaterialSymbol from '../styles/MaterialSymbol';

const ListDiv = styled.div<{ $disabled?: boolean }>`
    width: 100%;
    padding: 8px;
    background-color: var(--color-3);
    border-radius: var(--border-radius);
    outline: 1px solid var(--color-2);

    display: flex;
    flex-direction: column;
    gap: var(--list-gap);

    .sortable-div {
        display: flex;
        flex-direction: column;
        gap: var(--list-gap);
    }
`;

interface FormSortableListProps {
    order: SORTABLE.ItemInterface[];
    onUpdateOrder: (newOrder: SORTABLE.ItemInterface[]) => void;
    disabled?: boolean;
    addPortNode?: React.ReactNode;
}

export const FormSortableList = ({ children, disabled, order, onUpdateOrder, addPortNode: addChild }: PropsWithChildren<FormSortableListProps>) => {
    const mutableOrder = useMemo(() => structuredClone(order), [order]);

    return (
        <ListDiv $disabled={disabled}>
            <SORTABLE.ReactSortable
                list={mutableOrder}
                setList={onUpdateOrder}
                className='sortable-div'
                disabled={disabled}
                handle='.handle'
                animation={100}
                children={children}
            />
            { addChild }
        </ListDiv>
    );
}

interface FormSortableListItemDivProps {
    $selected?: boolean;
    $disabled?: boolean;
}

export const FormSortableListItemDiv = styled.div.attrs<FormSortableListItemDivProps>(({ $selected }) => ({
    className: $selected && 'selected',
})) <FormSortableListItemDivProps>`
    width: 100%;
    min-height: var(--list-height);
    display: flex;
    align-items: center;

    border-radius: var(--border-radius);
    background-color: var(--color-2);
    ${({ $selected }) => $selected && 'background-color: var(--color-1);'}
`;

interface FormSortableListHandleProps {
    disabled?: boolean
}

export const FormSortableListHandle = ({ disabled }: PropsWithChildren<FormSortableListHandleProps>) => {
    return (
        <MaterialSymbol className='handle' $size={20} $cursor='move'
            $disabled={disabled}>drag_handle</MaterialSymbol>
    );
}