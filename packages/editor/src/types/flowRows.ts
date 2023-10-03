
export interface FlowJointStyling {
    background: string | null;
    border: string | null;
    shape: 'square' | 'round';
    borderStyle: 'dashed' | 'solid';
}

export type FlowConnectingStrategy = 'list' | 'static';