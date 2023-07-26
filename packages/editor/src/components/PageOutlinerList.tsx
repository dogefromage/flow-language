import React, { PropsWithChildren, useMemo } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { selectFlows } from '../slices/flowsSlice';
import { editorSetActiveFlow, selectEditor } from '../slices/editorSlice';

const OutlinerListDiv = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 1.5rem;
`;

const OutlinerFlowEntry = styled.div<{ $active: boolean }>`
    padding: 0.5rem;
    background-color: var(${({ $active }) => $active ? '--color-1' : '--color-2' });

    ${({ $active }) => $active && `width: calc(100% + 1.5rem);` }

    cursor: pointer;
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
                        <p>{flow.name}</p>
                    </OutlinerFlowEntry>
                )
            }
        </OutlinerListDiv>
    );
}

export default PageOutlinerList;