import React, { PropsWithChildren, useMemo, useState } from 'react';
import * as SORTABLE from 'react-sortablejs';
import styled from 'styled-components';
import MaterialSymbol from '../styles/MaterialSymbol';
import FormRenameField from './FormRenameField';
import FormSelectOption from './FormSelectOption';

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

const ItemDiv = styled.div<{ $selected?: boolean, $disabled?: boolean }>`
    width: 100%;
    padding: 0 0.5rem;
    height: var(--list-height);
    cursor: pointer;

    display: flex;
    justify-content: space-between;
    align-items: center;

    border-radius: var(--border-radius);
    background-color: var(--color-2);
    ${({ $selected }) => $selected && 'background-color: var(--color-1);'}

    .left, .right {
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 0.25rem;
    }
`;

const AddDiv = styled(ItemDiv)``;

interface Item {
    id: string
    label: string;
}

type FormSortableListProps = {
    order: Item[];
    selected?: string;
    onOrder?: (newOrder: Item[]) => void;
    onRename?: (id: string, newName: string) => void;
    onRemove?: (id: string) => void;
    onSelect?: (id: string) => void;
    onAdd?: () => void;
    addMessage?: string;
}

export const FormSortableList = ({ order, selected, onOrder, onSelect, onRename, onRemove, onAdd, addMessage }: PropsWithChildren<FormSortableListProps>) => {
    const mutableOrder = useMemo(() => structuredClone(order), [order]);

    return (
        <ListDiv /* $disabled={disabled} */>
            <SORTABLE.ReactSortable
                list={mutableOrder}
                setList={onOrder}
                className='sortable-div'
                // disabled={disabled}
                handle='.handle'
                animation={100}
            >{
                    order.map((row, index) =>
                        <ItemDiv
                            key={row.id + index}
                            // $disabled={locked}
                            $selected={/* !locked && */ row.id === selected}
                            onClick={() => {
                                onSelect?.(row.id);
                            }}
                        >
                            <div className='left'>
                                <MaterialSymbol className='handle' $size={20} $cursor='move'
                                    /* $disabled={disabled */>drag_handle</MaterialSymbol>
                                <FormRenameField
                                    value={row.label}
                                    onChange={newValue => onRename?.(row.id, newValue)}
                                    // disabled={locked}
                                />
                            </div>
                            <div className='right'>
                                <MaterialSymbol $button $size={22} /* $disabled={locked} */
                                    onClick={() => onRemove?.(row.id)}>close</MaterialSymbol>
                            </div>
                        </ItemDiv>
                    )}
            </SORTABLE.ReactSortable>
            {
                <AddDiv onClick={onAdd}>
                    <p>{ addMessage || 'Add Item' }</p>
                    <MaterialSymbol className='handle' $size={20} $button>add</MaterialSymbol>
                </AddDiv>
            }
        </ListDiv>
    );
}