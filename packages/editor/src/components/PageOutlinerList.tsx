import React, { PropsWithChildren, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { editorSetActiveFlow, selectEditor } from '../slices/editorSlice';
import { flowsCreate, selectFlows } from '../slices/flowsSlice';
import { emptyFlowSignature, flowsIdRegex } from '../types';
import FormRenameField from './FormRenameField';
import { selectDocumentContext } from '../slices/contextSlice';
import useContextMenu from '../utils/useContextMenu';

const OutlinerListDiv = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
    padding: 0.25rem 0.5rem;
    gap: var(--list-gap);
    /* gap: 0.5rem; */
`;

const OutlinerEntryDiv = styled.div<{ $active: boolean }>`
    padding: 0 0.5rem;
    height: var(--list-height);
    display: flex;
    flex-shrink: 0;
    align-items: center;

    ${({ $active }) => $active && `background-color: var(--color-2);`}
    /* ${({ $active }) => $active && `outline: 1px solid var(--color-1);`} */
    border-radius: var(--border-radius);

    cursor: pointer;

    &>p {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

interface PageOutlinerEntryProps {
    panelId: string;
    flowId: string;
}
const PageOutlinerEntry = ({ panelId, flowId }: PropsWithChildren<PageOutlinerEntryProps>) => {
    const dispatch = useAppDispatch();
    const editorState = useAppSelector(selectEditor);
    const contextHandler = useContextMenu(
        panelId,
        'Flow', [
        'pageOutliner.deleteFlowEntry',
    ],
        () => ({ flowId }),
    );

    return (
        <OutlinerEntryDiv
            onContextMenu={contextHandler}
            onClick={() => {
                dispatch(editorSetActiveFlow({
                    flowId,
                }));
            }}
            $active={editorState.activeFlow == flowId}
        >
            <p>{flowId}</p>
        </OutlinerEntryDiv>
    );
}


const ListSpacerDiv = styled.div`
    height: 100%;
`;

interface PageOutlinerListProps {
    panelId: string;
}

const PageOutlinerList = ({ panelId }: PropsWithChildren<PageOutlinerListProps>) => {
    const dispatch = useAppDispatch();

    const { documentContext } = useAppSelector(selectDocumentContext);
    const flowIds = useMemo(() => {
        if (!documentContext) return [];
        return Object
            .keys(documentContext.flowContexts)
            .sort((a, b) => a.localeCompare(b));
    }, [documentContext]);


    const [additional, setAdditional] = useState(false);

    return (
        <OutlinerListDiv>
            {
                flowIds.map(flowId =>
                    <PageOutlinerEntry panelId={panelId} flowId={flowId} key={flowId} />
                )
            }{
                additional &&
                <FormRenameField
                    value={'my_flow'}
                    onValidate={newVal => {
                        if (newVal.length == 0) {
                            return { message: 'Please provide a name.' };
                        }
                        if (!flowsIdRegex.test(newVal)) {
                            return { message: 'Please provide a valid name. A name should only contain letters, digits, underscores and should not start with a number. Example: "add_5"' };
                        }
                        if (flowIds.includes(newVal)) {
                            return { message: `There is already a flow named '${newVal}'. Please use a different name.` };
                        }
                    }}
                    onChange={newVal => {
                        dispatch(flowsCreate({
                            flowId: newVal,
                            signature: emptyFlowSignature,
                            undo: { desc: 'Created new flow.' },
                        }));
                        setAdditional(false);
                    }}
                    autofocus
                    onBlur={() => {
                        setAdditional(false);
                    }}
                />
            }
            <ListSpacerDiv
                onDoubleClick={() => {
                    setAdditional(true);
                }}
            ></ListSpacerDiv>
        </OutlinerListDiv>
    );
}

export default PageOutlinerList;