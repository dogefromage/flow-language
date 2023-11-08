import { PropsWithChildren, useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectDocument } from '../slices/documentSlice';
import { editorSetActiveFlow, selectEditor } from '../slices/editorSlice';
import { flowsCreate } from '../slices/flowsSlice';
import { useFlowNamingValidator } from '../utils/flows';
import useContextMenu from '../utils/useContextMenu';
import FormRenameField from './FormRenameField';
import { defaultFlowSignature } from '../content/defaultDocument';

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
        'Flow',
        [ 'pageOutliner.deleteFlowEntry' ],
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


const ListRemainingDiv = styled.div`
    height: 100%;

    .add {
        background-color: unset;
        border: unset;
        outline: unset;
        cursor: pointer;
        width: 100%;
        justify-content: center;
        font-size: 14px;
        padding: 0.25rem 0.5rem;
    }
`;

interface PageOutlinerListProps {
    panelId: string;
}

const PageOutlinerList = ({ panelId }: PropsWithChildren<PageOutlinerListProps>) => {
    const dispatch = useAppDispatch();
    const document = useAppSelector(selectDocument);
    const [additional, setAdditional] = useState(false);
    const flowNamingValidator = useFlowNamingValidator();

    return (
        <OutlinerListDiv>
            {
                Object.keys(document.flows).map(flowId =>
                    <PageOutlinerEntry panelId={panelId} flowId={flowId} key={flowId} />
                )
            }{
                additional &&
                <FormRenameField
                    value={'my_flow'}
                    onValidate={flowNamingValidator}
                    onChange={newVal => {
                        dispatch(flowsCreate({
                            flowId: newVal,
                            signature: defaultFlowSignature,
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
            <ListRemainingDiv
                onDoubleClick={() => {
                    setAdditional(true);
                }}
            > {
                    !additional &&
                    <button className="add"
                        onClick={() => setAdditional(true)}>
                        Add flow
                    </button>
                }
            </ListRemainingDiv>
        </OutlinerListDiv>
    );
}

export default PageOutlinerList;