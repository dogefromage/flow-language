import React from 'react';
import Menus from '../components/Menus';

export const defaultToolbarInlineMenus: React.FC[] = [
    () => (
        <Menus.ExpandInline name='Document'>
            <Menus.Command commandId='global.export_document' />
        </Menus.ExpandInline>
    ),
    () => (
        <Menus.ExpandInline name='Edit'>
            <Menus.Command commandId='global.undo' />
            <Menus.Command commandId='global.redo' />
        </Menus.ExpandInline>
    )
];