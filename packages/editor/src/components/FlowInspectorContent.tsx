import styled from "styled-components";
import { useAppSelector } from "../redux/stateHooks";
import { selectDocument } from "../slices/documentSlice";
import { selectEditor } from "../slices/editorSlice";
import FlowInspectorContentDocument from "./FlowInspectorContentDocument";
import FlowInspectorContentFlow from "./FlowInspectorContentFlow";
import FlowInspectorContentSelection from "./FlowInspectorContentSelection";

const InspectorWrapper = styled.div`
    min-height: 100%;
    overflow-x: hidden;
    container-type: size;
`;

interface Props {
    panelId: string
}

const FlowInspectorContent = ({ panelId }: Props) => {
    const document = useAppSelector(selectDocument);
    const flowId = useAppSelector(selectEditor).activeFlow;
    const flow = document.flows[flowId!];

    return (
        <InspectorWrapper>
            <FlowInspectorContentDocument panelId={panelId} />
            <FlowInspectorContentFlow panelId={panelId} />
            <FlowInspectorContentSelection panelId={panelId} />
        </InspectorWrapper>
    );
}

export default FlowInspectorContent;
