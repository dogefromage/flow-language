import { DocumentProblem, FlowDocumentContext, FlowGraphProblem, NodeProblem, RowProblem } from "..";

export type AllFlowProblems = DocumentProblem | FlowGraphProblem | NodeProblem | RowProblem;

export interface ProblemTreeNode {
    name: string;
    problems: AllFlowProblems[];
    children: ProblemTreeNode[];
}

export function generateProblemTree(doc: FlowDocumentContext): ProblemTreeNode | null {

    const flowProblems: ProblemTreeNode[] = [];
    for (const [ flowId, flow ] of Object.entries(doc.flowContexts)) {

        const nodeProblems: ProblemTreeNode[] = [];
        for (const [ nodeId, node ] of Object.entries(flow.nodeContexts)) {

            const rowProblems: ProblemTreeNode[] = [];
            for (const [ rowId, row ] of Object.entries(node.inputRows)) {
                if (row.problems.length) {
                    rowProblems.push({
                        name: `Input Row '${rowId}'`,
                        problems: row.problems,
                        children: [],
                    });
                }
            }
            if (node.outputRow.problems.length) {
                rowProblems.push({
                    name: `Output Row`,
                    problems: node.outputRow.problems,
                    children: [],
                });
            }

            if (rowProblems.length > 0 || node.problems.length) {
                nodeProblems.push({
                    name: `Node '${nodeId}'`,
                    problems: node.problems,
                    children: rowProblems,
                });
            }
        }

        if (nodeProblems.length || flow.problems.length) {
            flowProblems.push({
                name: `Flow '${flowId}'`,
                problems: flow.problems,
                children: nodeProblems,
            });
        }
    }

    if (flowProblems.length > 0 || doc.problems.length > 0) {
        return {
            name: 'Document',
            problems: doc.problems,
            children: flowProblems,
        };
    }
    return null;
}