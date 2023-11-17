import { useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { MaterialSymbol } from '../styles/icons';
import { Vec2 } from '../types';
import Menus from './Menus';

export interface SelectOptionContent {
    names: Record<string, string>;
    options: string[];
}

const SelectOptionDiv = styled.div<{ 
    disabled?: boolean, 
    $widthInline?: boolean,
    $centerValue?: boolean,
}>`
    position: relative;
    height: 1.6rem;
    max-height: 100%;
    ${({ $widthInline }) => $widthInline && 'width: fit-content;' }

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
    
    padding: 0 0.5rem;
    border-radius: var(--border-radius);
    background-color: var(--color-2);

    cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer' };

    ${({ disabled }) => disabled && `color: #00000066;` }

    p {
        ${({ $centerValue }) => $centerValue && css`
            flex-grow: 1;
            text-align: center;
        `}
        
        margin: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
`;

export interface SelectOptionProps {
    value: string;
    options: string[];
    onChange?: (newValue: string) => void;
    mapName?: Record<string, string>;
    className?: string;
    icon?: string;
    disabled?: boolean;
    widthInline?: boolean;
    centerValue?: boolean;
}

const FormSelectOption = ({ className, icon, value, onChange, options, mapName, disabled, widthInline, centerValue }: SelectOptionProps) => {
    const [ dropdown, setDropdown ] = useState<{
        menuId: string;
        anchor: Vec2;
        width: number;
    }>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    return (
        <SelectOptionDiv
            className={className}
            onClick={() => {
                if (disabled) return;
                const rect = wrapperRef.current!.getBoundingClientRect();
                setDropdown({
                    menuId: `select-option-menu:${uuidv4()}`,
                    anchor: { x: rect.left, y: rect.bottom },
                    width: rect.width,
                });
            }}
            ref={wrapperRef}
            disabled={disabled}
            $widthInline={widthInline}
            $centerValue={centerValue}
        >
            <p>{mapName?.[ value ] ?? value}</p>
            {
                dropdown &&
                <Menus.RootFloating menuId={dropdown.menuId} anchor={dropdown.anchor}
                    onClose={() => setDropdown(undefined)} desiredWidth={dropdown.width}> {
                        options.length ? (
                            options.map(opt => 
                                <Menus.Button key={opt} name={mapName?.[ opt ] || opt} 
                                    onPush={() => {
                                        onChange?.(opt);
                                        setDropdown(undefined);
                                    }}
                                />
                            )
                        ) : (
                            <Menus.Button name='No Options'/>
                        )
                    }
                </Menus.RootFloating>
            }
            <MaterialSymbol $size={20}>{ icon ?? 'expand_more' }</MaterialSymbol>
        </SelectOptionDiv>
    );
}

export default FormSelectOption;