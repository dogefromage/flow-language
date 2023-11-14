import React, { PropsWithChildren } from 'react';
import { documentSetTitle, documentSetDescription, selectDocument } from '../slices/documentSlice';
import FormExpandableRegion from './FormExpandableRegion';
import FormRenameField from './FormRenameField';
import { FormSettingsTable } from '../styles/formStyles';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';

interface FlowInspectorContentDocumentProps {
    panelId: string;
}

const FlowInspectorContentDocument = ({ panelId }: PropsWithChildren<FlowInspectorContentDocumentProps>) => {
    const dispatch = useAppDispatch();
    const document = useAppSelector(selectDocument);

    return (
        <FormExpandableRegion name='Document' defaultValue={true}>
            <FormSettingsTable>
                <p>Title</p>
                <FormRenameField
                    value={document.title}
                    onChange={newValue => {
                        dispatch(documentSetTitle({
                            title: newValue,
                            undo: { desc: `Updated document title to '${newValue}'.` },
                        }));
                    }}
                />
                <p>Description</p>
                <FormRenameField
                    value={document.description}
                    onChange={newValue => {
                        dispatch(documentSetDescription({
                            description: newValue,
                            undo: { desc: `Updated document description to '${newValue}'.` },
                        }));
                    }}
                />
            </FormSettingsTable>
        </FormExpandableRegion>
    );
}

export default FlowInspectorContentDocument;