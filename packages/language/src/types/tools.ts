
type SelectionItem = 
    | { type: 'node',   id: string }
    | { type: 'region', id: string }

export interface FlowSelection {
    flowId: string;
    items: SelectionItem[];
}