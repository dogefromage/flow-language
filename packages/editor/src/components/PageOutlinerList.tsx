import React, { PropsWithChildren, useMemo } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { editorSetActiveFlow, selectEditor } from '../slices/editorSlice';
import { flowsCreate, selectFlows } from '../slices/flowsSlice';
import { emptyFlowSignature } from '../types';
import { formatFlowLabel } from '../utils/flows';

const OutlinerListDiv = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
    padding: 0.25rem 0.5rem;
    gap: var(--list-gap);
    /* gap: 0.5rem; */
`;

const OutlinerFlowEntry = styled.div<{ $active: boolean }>`
    padding: 0 0.5rem;
    height: var(--list-height);
    display: flex;
    align-items: center;

    ${({ $active }) => $active && `background-color: var(--color-2);` }
    /* ${({ $active }) => $active && `outline: 1px solid var(--color-1);` } */
    border-radius: var(--border-radius);

    cursor: pointer;
`;

const ListSpacerDiv = styled.div`
    height: 100%;
`;

interface PageOutlinerListProps {
    panelId: string;
}

const PageOutlinerList = ({ panelId }: PropsWithChildren<PageOutlinerListProps>) => {
    const dispatch = useAppDispatch();
    const editorState = useAppSelector(selectEditor);

    const flows = useAppSelector(selectFlows);
    const flowList = useMemo(() =>
        Object.values(flows).sort((a, b) => a.id.localeCompare(b.id)),
        [flows],
    );

    return (
        <OutlinerListDiv>
            {
                flowList.map(flow =>
                    <OutlinerFlowEntry 
                        key={flow.id}
                        onClick={() => {
                            dispatch(editorSetActiveFlow({
                                flowId: flow.id,
                            }));
                        }}
                        $active={editorState.activeFlow == flow.id}
                    >
                        <p>{ formatFlowLabel(flow.id) }</p>
                        {/* <FormRenameField 
                            value={flow.name}
                            onChange={newVal => {
                                dispatch(flowsRename({
                                    flowId: flow.id,
                                    name: newVal,
                                    undo: { desc: `Renamed flow '${flow.name}' to '${newVal}'.`},
                                }));
                            }}
                        /> */}
                    </OutlinerFlowEntry>
                )
            }
            <ListSpacerDiv 
                onDoubleClick={() => {
                    dispatch(flowsCreate({
                        signature: emptyFlowSignature,
                        undo: { desc: 'Created new flow.' },
                    }));
                }}
            />
        </OutlinerListDiv>
    );
}

export default PageOutlinerList;