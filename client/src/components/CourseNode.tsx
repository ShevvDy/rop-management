import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type CourseNodeData = {
    code: string;
    name: string;
    credits: number;
    type: 'required' | 'elective' | 'core';
    semester: string;
};

type CourseNodeType = Node<CourseNodeData>;

const typeStyles: Record<string, { bg: string; border: string; badge: string; badgeBg: string; label: string }> = {
    required: {
        bg: '#fff',
        border: '#3B82F6',
        badge: '#fff',
        badgeBg: '#3B82F6',
        label: 'ОБЯЗАТЕЛЬНО',
    },
    elective: {
        bg: '#fff',
        border: '#F59E0B',
        badge: '#fff',
        badgeBg: '#F59E0B',
        label: 'ПО ВЫБОРУ',
    },
    core: {
        bg: '#fff',
        border: '#94A3B8',
        badge: '#64748B',
        badgeBg: '#F1F5F9',
        label: 'БАЗОВЫЙ',
    },
};

function CourseNode({ data, selected }: NodeProps<CourseNodeType>) {
    const style = typeStyles[data.type] || typeStyles.core;

    return (
        <div
            className={`flow-course-node ${selected ? 'selected' : ''}`}
            style={{
                borderColor: selected ? '#135BEC' : style.border,
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="flow-handle"
            />

            <div className="flow-node-header">
                <span
                    className="flow-node-badge"
                    style={{ background: style.badgeBg, color: style.badge }}
                >
                    {style.label}
                </span>
                {data.code && (
                    <span className="flow-node-code">{data.code}</span>
                )}
            </div>

            <div className="flow-node-name">{data.name}</div>

            <div className="flow-node-footer">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="#94A3B8" strokeWidth="1.2" />
                    <path d="M7 4v3l2 1" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span className="flow-node-credits">{data.credits} Часа</span>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="flow-handle"
            />
        </div>
    );
}

export default memo(CourseNode);
