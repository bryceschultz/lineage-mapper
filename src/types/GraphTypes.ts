
interface Edge {
    id: string;
    source: string;
    target: string;
    type: 'table-table' | 'field-field';
}

interface Graph {
    nodes: Node[];
    edges: Edge[];
}

interface Node {
    id: string;
    type: 'table' | 'field';
    name: string;
    tableId?: string;
    x?: number;
    y?: number;
}

export type {
    Edge,
    Graph,
    Node
}