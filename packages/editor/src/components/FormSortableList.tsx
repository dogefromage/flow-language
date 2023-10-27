import React, { PropsWithChildren, useMemo, useState } from 'react';
import * as SORTABLE from 'react-sortablejs';
import styled from 'styled-components';
import FormRenameField, { NameValidationError } from './FormRenameField';
import { MaterialSymbol } from '../styles/icons';

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
    label?: string;
}

export interface FormSortableListProps {
    order: Item[];
    selected?: string;
    onOrder?: (newOrder: Item[]) => void;
    onRename?: (id: string, newId: string) => void;
    onRemove?: (id: string) => void;
    onSelect?: (id: string) => void;
    onAdd?: (name: string) => void;
    onValidateNewName?: (newValue: string) => NameValidationError | undefined;
    addMessage?: string;
    disableAdd?: boolean;
}

const FormSortableList = ({ order, selected, onOrder, onSelect, onRename, 
    onRemove, onAdd, addMessage, disableAdd, onValidateNewName }: PropsWithChildren<FormSortableListProps>) => {
    const mutableOrder = useMemo(() => structuredClone(order), [order]);
    const [ additional, setAdditional ] = useState(false);

    return (
        <ListDiv>
            {
                order.length ?
                    <SORTABLE.ReactSortable
                        list={mutableOrder}
                        setList={onOrder || (() => {})}
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
                                            disabled={!onRename}
                                            value={row.label || row.id}
                                            onChange={newId => onRename?.(row.id, newId)}
                                            onValidate={onValidateNewName}
                                        />
                                    </div>
                                    <div className='right'>
                                        <MaterialSymbol $button $size={22} /* $disabled={locked} */
                                            onClick={() => onRemove?.(row.id)}>close</MaterialSymbol>
                                    </div>
                                </ItemDiv>
                            )}
                    </SORTABLE.ReactSortable>
                    : null
            }{
                additional &&
                <FormRenameField
                    value={''}
                    onValidate={onValidateNewName}
                    onChange={newName => {
                        onAdd?.(newName);
                        setAdditional(false);
                    }}
                    onBlur={() => {
                        setAdditional(false);
                    }}
                    autofocus
                />
            }{
                !disableAdd &&
                <AddDiv onClick={() => setAdditional(true)}>
                    <p>{addMessage || 'Add Item'}</p>
                    <MaterialSymbol className='handle' $size={20} $button>add</MaterialSymbol>
                </AddDiv>
            }
        </ListDiv>
    );
}

export default FormSortableList;