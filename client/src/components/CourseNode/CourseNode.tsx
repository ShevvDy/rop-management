import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import styles from './CourseNode.module.css';

export type CourseNodeData = {
    code: string;
    name: string;
    credits: number;
    type: 'required' | 'elective';
    semester: string;
};

type CourseNodeType = Node<CourseNodeData>;

const typeStyles: Record<string, { border: string; badge: string; badgeBg: string; label: string }> = {
    required: {
        border: '#3B82F6',
        badge: '#fff',
        badgeBg: '#3B82F6',
        label: 'ОБЯЗАТЕЛЬНО',
    },
    elective: {
        border: '#F59E0B',
        badge: '#fff',
        badgeBg: '#F59E0B',
        label: 'ПО ВЫБОРУ',
    },
};

function CourseNode({ data, selected }: NodeProps<CourseNodeType>) {
    const style = typeStyles[data.type] || typeStyles.core;

    return (
        <div
            className={`${styles.node} ${selected ? styles.selected : ''}`}
            style={{ borderColor: selected ? '#135BEC' : style.border }}
        >
            <Handle type="target" position={Position.Top} className={styles.handle} />

            <div className={styles.header}>
                <span
                    className={styles.badge}
                    style={{ background: style.badgeBg, color: style.badge }}
                >
                    {style.label}
                </span>
                {data.code && <span className={styles.code}>{data.code}</span>}
            </div>

            <div className={styles.name}>{data.name}</div>

            <div className={styles.footer}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="#94A3B8" strokeWidth="1.2" />
                    <path d="M7 4v3l2 1" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span className={styles.credits}>{data.credits} Часа</span>
            </div>

            <Handle type="source" position={Position.Bottom} className={styles.handle} />
        </div>
    );
}

export default memo(CourseNode);
