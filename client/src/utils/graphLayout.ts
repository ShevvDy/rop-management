import dagre from '@dagrejs/dagre';
import { Position, type Node, type Edge } from '@xyflow/react';

/**
 * Каноническая dagre-раскладка из официального примера React Flow:
 * https://reactflow.dev/examples/layout/dagre
 */

/* Должно совпадать с реальными размерами .node в CourseNode.module.css */
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 115;

export type LayoutDirection = 'TB' | 'LR';

export function getLayoutedElements<TData extends Record<string, unknown>>(
    nodes: Node<TData>[],
    edges: Edge[],
    direction: LayoutDirection = 'TB',
): { nodes: Node<TData>[]; edges: Edge[] } {
    if (nodes.length === 0) return { nodes: [], edges: [...edges] };

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 50,
        ranksep: 70,
        marginx: 20,
        marginy: 20,
        align: 'UL',
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
            },
        };
    });

    return { nodes: newNodes, edges: [...edges] };
}
