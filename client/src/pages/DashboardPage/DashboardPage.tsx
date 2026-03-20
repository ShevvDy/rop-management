import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    useReactFlow,
    addEdge,
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type Node,
    type Edge,
    type EdgeProps,
    type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CourseNode, { type CourseNodeData } from '../../components/CourseNode';
import CourseDetailPanel, { type CourseDetail } from '../../components/CourseDetailPanel';
import styles from './DashboardPage.module.css';

/* ═══════════════════════════════════════════
   Mock data
   ═══════════════════════════════════════════ */

interface Program {
    id: string;
    name: string;
    code: string;
    degree: string;
    faculty: string;
    color: string;
    yearsCount: number;
    coursesCount: number;
}

interface YearPlan {
    id: string;
    year: number;
    label: string;
    status: 'active' | 'draft' | 'archived';
    coursesCount: number;
    studentsCount: number;
}

const programs: Program[] = [
    { id: 'se', name: 'Программная инженерия', code: '09.03.04', degree: 'Бакалавриат', faculty: 'Факультет ИТ', color: '#135BEC', yearsCount: 4, coursesCount: 42 },
    { id: 'cs', name: 'Компьютерные науки', code: '09.03.01', degree: 'Бакалавриат', faculty: 'Факультет ИТ', color: '#8B5CF6', yearsCount: 3, coursesCount: 38 },
    { id: 'ai', name: 'Искусственный интеллект', code: '09.04.01', degree: 'Магистратура', faculty: 'Факультет ИИ', color: '#059669', yearsCount: 2, coursesCount: 24 },
    { id: 'ds', name: 'Науки о данных', code: '01.04.02', degree: 'Магистратура', faculty: 'Факультет математики', color: '#D97706', yearsCount: 2, coursesCount: 20 },
    { id: 'is', name: 'Информационная безопасность', code: '10.03.01', degree: 'Бакалавриат', faculty: 'Факультет ИТ', color: '#DC2626', yearsCount: 3, coursesCount: 36 },
];

const yearPlans: Record<string, YearPlan[]> = {
    se: [
        { id: 'se-2025', year: 2025, label: '2025/2026', status: 'draft', coursesCount: 42, studentsCount: 0 },
        { id: 'se-2024', year: 2024, label: '2024/2025', status: 'active', coursesCount: 42, studentsCount: 128 },
        { id: 'se-2023', year: 2023, label: '2023/2024', status: 'active', coursesCount: 40, studentsCount: 115 },
        { id: 'se-2022', year: 2022, label: '2022/2023', status: 'archived', coursesCount: 38, studentsCount: 102 },
    ],
    cs: [
        { id: 'cs-2024', year: 2024, label: '2024/2025', status: 'active', coursesCount: 38, studentsCount: 95 },
        { id: 'cs-2023', year: 2023, label: '2023/2024', status: 'active', coursesCount: 36, studentsCount: 88 },
        { id: 'cs-2022', year: 2022, label: '2022/2023', status: 'archived', coursesCount: 34, studentsCount: 76 },
    ],
    ai: [
        { id: 'ai-2024', year: 2024, label: '2024/2025', status: 'active', coursesCount: 24, studentsCount: 45 },
        { id: 'ai-2023', year: 2023, label: '2023/2024', status: 'active', coursesCount: 22, studentsCount: 40 },
    ],
    ds: [
        { id: 'ds-2024', year: 2024, label: '2024/2025', status: 'active', coursesCount: 20, studentsCount: 32 },
        { id: 'ds-2023', year: 2023, label: '2023/2024', status: 'active', coursesCount: 18, studentsCount: 28 },
    ],
    is: [
        { id: 'is-2024', year: 2024, label: '2024/2025', status: 'active', coursesCount: 36, studentsCount: 72 },
        { id: 'is-2023', year: 2023, label: '2023/2024', status: 'active', coursesCount: 34, studentsCount: 68 },
        { id: 'is-2022', year: 2022, label: '2022/2023', status: 'archived', coursesCount: 32, studentsCount: 60 },
    ],
};

/* ── Course detail mocks (per year, simplified — same for demo) ── */
const courseDetails: Record<string, CourseDetail> = {
    cs201: { id: 'cs201', code: 'CS-201', name: 'Структуры данных и алгоритмы', semester: 'Осенний семестр', type: 'required', credits: 4, summary: 'Курс охватывает фундаментальные структуры данных, включая стеки, очереди, деревья и графы.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Ann1&backgroundColor=b6e3f4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dima2&backgroundColor=c0aede', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Katya3&backgroundColor=ffd5dc'], total: 46 }, teachers: [{ name: 'Д-р Роберт Чен', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrChen&backgroundColor=ffd5dc' }], materials: [{ name: 'Учебный_план_2024.pdf', size: '1.2 МБ', date: '2 дня назад', type: 'pdf' }, { name: 'Лекция_1_Слайды.pptx', size: '4.5 МБ', date: 'Вчера', type: 'pptx' }] },
    cs101: { id: 'cs101', code: 'CS-101', name: 'Введение в программирование', semester: 'Осенний семестр', type: 'required', credits: 6, summary: 'Основы программирования на Python. Переменные, условия, циклы, функции, работа с файлами.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Stud1&backgroundColor=ffd5dc', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stud2&backgroundColor=c0aede'], total: 120 }, teachers: [{ name: 'Проф. Алексей Иванов', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfIvanov&backgroundColor=b6e3f4' }], materials: [{ name: 'Программа_курса.pdf', size: '800 КБ', date: '1 нед. назад', type: 'pdf' }] },
    mth202: { id: 'mth202', code: 'MTH-202', name: 'Линейная алгебра', semester: 'Весенний семестр', type: 'core', credits: 4, summary: 'Матрицы, определители, системы линейных уравнений. Векторные пространства.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=M1&backgroundColor=c0aede'], total: 85 }, teachers: [{ name: 'Доц. Мария Петрова', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DocPetrova&backgroundColor=c0aede' }], materials: [{ name: 'Лекции_ЛинАлгебра.pdf', size: '6.1 МБ', date: '5 дней назад', type: 'pdf' }] },
    cs301: { id: 'cs301', code: 'CS-301', name: 'Базы данных', semester: 'Весенний семестр', type: 'required', credits: 4, summary: 'Реляционные БД, SQL, нормализация, индексирование. Введение в NoSQL.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=DB1&backgroundColor=b6e3f4'], total: 38 }, teachers: [{ name: 'Д-р Олег Сидоров', role: 'Практик', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrSidorov&backgroundColor=b6e3f4' }], materials: [{ name: 'SQL_Практикум.pdf', size: '2.3 МБ', date: 'Вчера', type: 'pdf' }] },
    cs401: { id: 'cs401', code: 'CS-401', name: 'Машинное обучение', semester: 'Осенний семестр', type: 'elective', credits: 5, summary: 'Основы ML: регрессия, классификация, кластеризация, нейронные сети.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=ML1&backgroundColor=c0aede'], total: 28 }, teachers: [{ name: 'Проф. Елена Козлова', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfKozlova&backgroundColor=ffd5dc' }], materials: [{ name: 'ML_Учебник.pdf', size: '12 МБ', date: '1 нед. назад', type: 'pdf' }] },
    mth101: { id: 'mth101', code: 'MTH-101', name: 'Математический анализ', semester: 'Осенний семестр', type: 'core', credits: 5, summary: 'Пределы, производные, интегралы. Ряды и дифференциальные уравнения.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=MA1&backgroundColor=b6e3f4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MA2&backgroundColor=c0aede'], total: 140 }, teachers: [{ name: 'Проф. Виктор Смирнов', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfSmirnov&backgroundColor=b6e3f4' }], materials: [{ name: 'Матанализ_Лекции.pdf', size: '9.5 МБ', date: '3 дня назад', type: 'pdf' }] },
    cs302: { id: 'cs302', code: 'CS-302', name: 'Компьютерные сети', semester: 'Весенний семестр', type: 'required', credits: 3, summary: 'Модели OSI и TCP/IP. Протоколы маршрутизации, DNS, HTTP/HTTPS.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Net1&backgroundColor=c0aede'], total: 32 }, teachers: [{ name: 'Доц. Андрей Волков', role: 'Практик', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DocVolkov&backgroundColor=b6e3f4' }], materials: [{ name: 'Сети_Практикум.pdf', size: '3.2 МБ', date: 'Вчера', type: 'pdf' }] },
};

/* Variant B nodes — for comparison (slightly different plan) */
const nodesVariantA: Node<CourseNodeData>[] = [
    { id: 'cs101', type: 'courseNode', position: { x: 100, y: 400 }, data: { code: 'CS-101', name: 'Введение в\nпрограммирование', credits: 6, type: 'required', semester: '1 семестр' } },
    { id: 'mth101', type: 'courseNode', position: { x: 500, y: 450 }, data: { code: 'MTH-101', name: 'Математический\nанализ', credits: 5, type: 'core', semester: '1 семестр' } },
    { id: 'cs201', type: 'courseNode', position: { x: 250, y: 220 }, data: { code: 'CS-201', name: 'Структуры данных и\nалгоритмы', credits: 4, type: 'required', semester: '2 семестр' } },
    { id: 'mth202', type: 'courseNode', position: { x: 500, y: 580 }, data: { code: 'MTH-202', name: 'Линейная алгебра', credits: 4, type: 'core', semester: '2 семестр' } },
    { id: 'cs301', type: 'courseNode', position: { x: 50, y: 50 }, data: { code: 'CS-301', name: 'Базы данных', credits: 4, type: 'required', semester: '3 семестр' } },
    { id: 'cs302', type: 'courseNode', position: { x: 450, y: 50 }, data: { code: 'CS-302', name: 'Компьютерные сети', credits: 3, type: 'required', semester: '3 семестр' } },
    { id: 'cs401', type: 'courseNode', position: { x: 250, y: -130 }, data: { code: 'CS-401', name: 'Машинное обучение', credits: 5, type: 'elective', semester: '4 семестр' } },
];

const nodesVariantB: Node<CourseNodeData>[] = [
    { id: 'cs101', type: 'courseNode', position: { x: 100, y: 400 }, data: { code: 'CS-101', name: 'Введение в\nпрограммирование', credits: 6, type: 'required', semester: '1 семестр' } },
    { id: 'mth101', type: 'courseNode', position: { x: 500, y: 450 }, data: { code: 'MTH-101', name: 'Математический\nанализ', credits: 5, type: 'core', semester: '1 семестр' } },
    { id: 'cs201', type: 'courseNode', position: { x: 250, y: 220 }, data: { code: 'CS-201', name: 'Структуры данных и\nалгоритмы', credits: 5, type: 'required', semester: '2 семестр' } },
    { id: 'mth202', type: 'courseNode', position: { x: 500, y: 580 }, data: { code: 'MTH-202', name: 'Линейная алгебра', credits: 4, type: 'core', semester: '2 семестр' } },
    { id: 'cs301', type: 'courseNode', position: { x: 50, y: 50 }, data: { code: 'CS-301', name: 'Базы данных', credits: 4, type: 'required', semester: '3 семестр' } },
    { id: 'cs302', type: 'courseNode', position: { x: 450, y: 50 }, data: { code: 'CS-302', name: 'Компьютерные сети', credits: 4, type: 'required', semester: '3 семестр' } },
    { id: 'cs402', type: 'courseNode', position: { x: 250, y: -130 }, data: { code: 'CS-402', name: 'Глубокое обучение', credits: 5, type: 'elective', semester: '4 семестр' } },
];

const edgeStyle = { stroke: '#CBD5E1', strokeWidth: 2 };
const edgesMain: Edge[] = [
    { id: 'e-cs101-cs201', source: 'cs101', target: 'cs201', type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs301', source: 'cs201', target: 'cs301', type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs302', source: 'cs201', target: 'cs302', type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs401', source: 'cs201', target: 'cs401', type: 'deletable', style: edgeStyle },
    { id: 'e-mth101-mth202', source: 'mth101', target: 'mth202', type: 'deletable', style: edgeStyle },
    { id: 'e-mth101-cs201', source: 'mth101', target: 'cs201', type: 'deletable', style: edgeStyle },
    { id: 'e-mth202-cs401', source: 'mth202', target: 'cs401', type: 'deletable', style: edgeStyle },
];

const edgesVariantB: Edge[] = [
    { id: 'e-cs101-cs201', source: 'cs101', target: 'cs201', type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs301', source: 'cs201', target: 'cs301', type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs302', source: 'cs201', target: 'cs302', type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs402', source: 'cs201', target: 'cs402', type: 'deletable', style: edgeStyle },
    { id: 'e-mth101-mth202', source: 'mth101', target: 'mth202', type: 'deletable', style: edgeStyle },
    { id: 'e-mth101-cs201', source: 'mth101', target: 'cs201', type: 'deletable', style: edgeStyle },
    { id: 'e-mth202-cs402', source: 'mth202', target: 'cs402', type: 'deletable', style: edgeStyle },
];

/* ═══════════════════════════════════════════
   Status helpers
   ═══════════════════════════════════════════ */
const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    active: { label: 'Активный', bg: '#DCFCE7', color: '#16A34A' },
    draft: { label: 'Черновик', bg: '#FEF3C7', color: '#D97706' },
    archived: { label: 'Архив', bg: '#F1F5F9', color: '#64748B' },
};

/* ═══════════════════════════════════════════
   Deletable Edge
   ═══════════════════════════════════════════ */
const DeletableEdge: React.FC<EdgeProps> = ({
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style,
}) => {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    return (
        <>
            <BaseEdge path={edgePath} style={style} />
            <EdgeLabelRenderer>
                <button className={styles.edgeDeleteBtn} style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }} onClick={() => setEdges((eds) => eds.filter((e) => e.id !== id))}>×</button>
            </EdgeLabelRenderer>
        </>
    );
};

/* ═══════════════════════════════════════════
   Graph Panel (single React Flow instance)
   ═══════════════════════════════════════════ */
interface GraphPanelProps {
    label: string;
    labelColor?: string;
    initNodes: Node<CourseNodeData>[];
    initEdges: Edge[];
    details: Record<string, CourseDetail>;
    onSelectCourse: (c: CourseDetail | null) => void;
    onDetailsChange: (d: Record<string, CourseDetail>) => void;
    compact?: boolean;
}

const GraphPanelInner: React.FC<GraphPanelProps> = ({ label, labelColor, initNodes, initEdges, details, onSelectCourse, onDetailsChange, compact }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
    const { screenToFlowPosition } = useReactFlow();
    const [menu, setMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
    const [dialog, setDialog] = useState(false);
    const [pendingPos, setPendingPos] = useState({ x: 0, y: 0 });
    const [form, setForm] = useState({ code: '', name: '', credits: 3, type: 'required' as CourseNodeData['type'], semester: '' });
    const menuRef = useRef<HTMLDivElement>(null);

    const nodeTypes = useMemo(() => ({ courseNode: CourseNode }), []);
    const edgeTypes = useMemo(() => ({ deletable: DeletableEdge }), []);

    useEffect(() => {
        if (!menu) return;
        const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Element)) setMenu(null); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menu]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        const d = details[node.id];
        if (d) onSelectCourse(d);
    }, [details, onSelectCourse]);

    const onConnect = useCallback((c: Connection) => { setEdges((eds) => addEdge({ ...c, type: 'deletable', style: edgeStyle }, eds)); }, [setEdges]);
    const onPaneClick = useCallback(() => { setMenu(null); onSelectCourse(null); }, [onSelectCourse]);
    const onPaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
        e.preventDefault();
        const fp = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setMenu({ x: e.clientX, y: e.clientY, flowX: fp.x, flowY: fp.y });
    }, [screenToFlowPosition]);

    const openAddDialog = useCallback(() => {
        if (!menu) return;
        setPendingPos({ x: menu.flowX, y: menu.flowY });
        setForm({ code: '', name: '', credits: 3, type: 'required', semester: '' });
        setMenu(null);
        setDialog(true);
    }, [menu]);

    const handleAddNode = useCallback(() => {
        if (!form.name.trim()) return;
        const id = `course-${Date.now()}`;
        const data: CourseNodeData = { code: form.code.trim(), name: form.name.trim(), credits: form.credits, type: form.type, semester: form.semester.trim() };
        setNodes((prev) => [...prev, { id, type: 'courseNode', position: pendingPos, data } as Node<CourseNodeData>]);
        onDetailsChange({ ...details, [id]: { id, code: data.code, name: data.name, semester: data.semester, type: data.type, credits: data.credits, summary: '', students: { avatars: [], total: 0 }, teachers: [], materials: [] } });
        setDialog(false);
    }, [form, pendingPos, setNodes, details, onDetailsChange]);

    return (
        <div className={`${styles.graphPanel} ${compact ? styles.graphPanelCompact : ''}`}>
            <div className={styles.graphPanelLabel} style={labelColor ? { borderLeftColor: labelColor } : undefined}>
                {label}
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onConnect={onConnect}
                onPaneClick={onPaneClick}
                onPaneContextMenu={onPaneContextMenu}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                isValidConnection={(c) => c.source !== c.target}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={24} size={1} color="#E8ECF1" />
                {!compact && <Controls showInteractive={false} />}
            </ReactFlow>

            {menu && (
                <div ref={menuRef} className={styles.contextMenu} style={{ top: menu.y, left: menu.x }}>
                    <button className={styles.contextMenuItem} onClick={openAddDialog}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        Добавить предмет
                    </button>
                </div>
            )}

            {dialog && (
                <div className={styles.dialogOverlay} onClick={() => setDialog(false)}>
                    <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.dialogHeader}>
                            <span>Новый предмет</span>
                            <button className={styles.dialogClose} onClick={() => setDialog(false)}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                        <div className={styles.dialogBody}>
                            <label className={styles.dialogLabel}>НАЗВАНИЕ *</label>
                            <input className={styles.dialogInput} placeholder="Например: Операционные системы" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
                            <label className={styles.dialogLabel}>КОД КУРСА</label>
                            <input className={styles.dialogInput} placeholder="Например: CS-303" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                            <div className={styles.dialogRow}>
                                <div className={styles.dialogField}>
                                    <label className={styles.dialogLabel}>ТИП</label>
                                    <select className={styles.dialogSelect} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CourseNodeData['type'] }))}>
                                        <option value="required">Обязательный</option>
                                        <option value="elective">По выбору</option>
                                        <option value="core">Базовый</option>
                                    </select>
                                </div>
                                <div className={styles.dialogField}>
                                    <label className={styles.dialogLabel}>ЧАСЫ</label>
                                    <input className={styles.dialogInput} type="number" min={1} max={10} value={form.credits} onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))} />
                                </div>
                            </div>
                            <label className={styles.dialogLabel}>СЕМЕСТР</label>
                            <input className={styles.dialogInput} placeholder="Например: 3 семестр" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} />
                        </div>
                        <div className={styles.dialogFooter}>
                            <button className={styles.dialogBtnCancel} onClick={() => setDialog(false)}>Отмена</button>
                            <button className={styles.dialogBtnSubmit} onClick={handleAddNode} disabled={!form.name.trim()}>Добавить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const GraphPanel: React.FC<GraphPanelProps> = (props) => (
    <ReactFlowProvider>
        <GraphPanelInner {...props} />
    </ReactFlowProvider>
);

/* ═══════════════════════════════════════════
   Create Modal (program or year)
   ═══════════════════════════════════════════ */
interface CreateProgramModalProps { onClose: () => void; onCreate: (p: Program) => void; }

const CreateProgramModal: React.FC<CreateProgramModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [degree, setDegree] = useState('Бакалавриат');
    const [faculty, setFaculty] = useState('');
    const colors = ['#135BEC', '#8B5CF6', '#059669', '#D97706', '#DC2626', '#0891B2', '#7C3AED', '#2563EB'];
    const [color, setColor] = useState(colors[0]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    return (
        <div className={styles.dialogOverlay} onClick={onClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.dialogHeader}>
                    <span>Новая образовательная программа</span>
                    <button className={styles.dialogClose} onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                </div>
                <div className={styles.dialogBody}>
                    <label className={styles.dialogLabel}>НАЗВАНИЕ ПРОГРАММЫ *</label>
                    <input className={styles.dialogInput} placeholder="Программная инженерия" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                    <div className={styles.dialogRow}>
                        <div className={styles.dialogField}>
                            <label className={styles.dialogLabel}>КОД НАПРАВЛЕНИЯ</label>
                            <input className={styles.dialogInput} placeholder="09.03.04" value={code} onChange={(e) => setCode(e.target.value)} />
                        </div>
                        <div className={styles.dialogField}>
                            <label className={styles.dialogLabel}>УРОВЕНЬ</label>
                            <select className={styles.dialogSelect} value={degree} onChange={(e) => setDegree(e.target.value)}>
                                <option>Бакалавриат</option>
                                <option>Магистратура</option>
                                <option>Специалитет</option>
                                <option>Аспирантура</option>
                            </select>
                        </div>
                    </div>
                    <label className={styles.dialogLabel}>ФАКУЛЬТЕТ / ИНСТИТУТ</label>
                    <input className={styles.dialogInput} placeholder="Факультет информационных технологий" value={faculty} onChange={(e) => setFaculty(e.target.value)} />
                    <label className={styles.dialogLabel}>ЦВЕТ</label>
                    <div className={styles.colorPicker}>
                        {colors.map((c) => (
                            <button key={c} className={`${styles.colorSwatch} ${color === c ? styles.active : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
                        ))}
                    </div>
                </div>
                <div className={styles.dialogFooter}>
                    <button className={styles.dialogBtnCancel} onClick={onClose}>Отмена</button>
                    <button className={styles.dialogBtnSubmit} disabled={!name.trim()} onClick={() => { onCreate({ id: `prog-${Date.now()}`, name: name.trim(), code: code.trim(), degree, faculty: faculty.trim(), color, yearsCount: 0, coursesCount: 0 }); }}>Создать</button>
                </div>
            </div>
        </div>
    );
};

interface CreateYearModalProps { onClose: () => void; onCreate: (y: YearPlan) => void; existingYears: number[]; }

const CreateYearModal: React.FC<CreateYearModalProps> = ({ onClose, onCreate, existingYears }) => {
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 6 }, (_, i) => currentYear + 2 - i).filter((y) => !existingYears.includes(y));
    const [year, setYear] = useState(availableYears[0] || currentYear);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    return (
        <div className={styles.dialogOverlay} onClick={onClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.dialogHeader}>
                    <span>Новый учебный план</span>
                    <button className={styles.dialogClose} onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                </div>
                <div className={styles.dialogBody}>
                    <label className={styles.dialogLabel}>ГОД НАБОРА</label>
                    <select className={styles.dialogSelect} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {availableYears.map((y) => (
                            <option key={y} value={y}>{y}/{y + 1}</option>
                        ))}
                    </select>
                    <p className={styles.dialogHint}>Будет создан пустой учебный план для набора {year}/{year + 1} года в статусе «Черновик».</p>
                </div>
                <div className={styles.dialogFooter}>
                    <button className={styles.dialogBtnCancel} onClick={onClose}>Отмена</button>
                    <button className={styles.dialogBtnSubmit} disabled={availableYears.length === 0} onClick={() => { onCreate({ id: `plan-${year}`, year, label: `${year}/${year + 1}`, status: 'draft', coursesCount: 0, studentsCount: 0 }); }}>Создать</button>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════
   Main Dashboard Page
   ═══════════════════════════════════════════ */
type View = 'programs' | 'years' | 'graph';

const DashboardPage: React.FC = () => {
    const [view, setView] = useState<View>('programs');
    const [allPrograms, setAllPrograms] = useState(programs);
    const [allYears, setAllYears] = useState(yearPlans);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [selectedYears, setSelectedYears] = useState<YearPlan[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
    const [detailsA, setDetailsA] = useState(courseDetails);
    const [detailsB, setDetailsB] = useState(courseDetails);
    const [showCreateProgram, setShowCreateProgram] = useState(false);
    const [showCreateYear, setShowCreateYear] = useState(false);

    const handleSelectProgram = (p: Program) => {
        setSelectedProgram(p);
        setSelectedYears([]);
        setView('years');
    };

    const handleToggleYear = (yp: YearPlan) => {
        setSelectedYears((prev) => {
            const exists = prev.find((y) => y.id === yp.id);
            if (exists) return prev.filter((y) => y.id !== yp.id);
            if (prev.length >= 2) return [prev[1], yp];
            return [...prev, yp];
        });
    };

    const handleOpenGraph = () => {
        if (selectedYears.length > 0) setView('graph');
    };

    const handleBack = () => {
        if (view === 'graph') { setView('years'); setSelectedCourse(null); }
        else if (view === 'years') { setView('programs'); setSelectedProgram(null); setSelectedYears([]); }
    };

    const handleSave = useCallback((updated: CourseDetail) => {
        setDetailsA((prev) => ({ ...prev, [updated.id]: updated }));
        setSelectedCourse(updated);
    }, []);

    const isCompare = selectedYears.length === 2;

    return (
        <div className={styles.page}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <button className={`${styles.breadcrumbItem} ${view === 'programs' ? styles.active : ''}`} onClick={() => { setView('programs'); setSelectedProgram(null); setSelectedYears([]); setSelectedCourse(null); }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Программы
                </button>
                {selectedProgram && (
                    <>
                        <svg className={styles.breadcrumbSep} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                        <button className={`${styles.breadcrumbItem} ${view === 'years' ? styles.active : ''}`} onClick={() => { setView('years'); setSelectedCourse(null); }}>
                            <span className={styles.breadcrumbDot} style={{ background: selectedProgram.color }} />
                            {selectedProgram.name}
                        </button>
                    </>
                )}
                {view === 'graph' && selectedYears.length > 0 && (
                    <>
                        <svg className={styles.breadcrumbSep} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                        <span className={`${styles.breadcrumbItem} ${styles.active}`}>
                            {isCompare ? `${selectedYears[0].label} vs ${selectedYears[1].label}` : selectedYears[0].label}
                        </span>
                    </>
                )}
            </div>

            {/* ── Programs View ── */}
            {view === 'programs' && (
                <div className={styles.gridView}>
                    <div className={styles.gridHeader}>
                        <div>
                            <h1 className={styles.gridTitle}>Образовательные программы</h1>
                            <p className={styles.gridSubtitle}>Выберите программу для просмотра учебных планов и графов зависимостей</p>
                        </div>
                    </div>
                    <div className={styles.cardGrid}>
                        {allPrograms.map((p) => (
                            <button key={p.id} className={styles.programCard} onClick={() => handleSelectProgram(p)}>
                                <div className={styles.programCardAccent} style={{ background: p.color }} />
                                <div className={styles.programCardBody}>
                                    <div className={styles.programCardTop}>
                                        <span className={styles.programDegree} style={{ background: `${p.color}14`, color: p.color }}>{p.degree}</span>
                                        <span className={styles.programCode}>{p.code}</span>
                                    </div>
                                    <h3 className={styles.programName}>{p.name}</h3>
                                    <p className={styles.programFaculty}>{p.faculty}</p>
                                    <div className={styles.programStats}>
                                        <div className={styles.programStat}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 5.5h11" stroke="currentColor" strokeWidth="1.2" /></svg>
                                            <span>{p.yearsCount} {p.yearsCount === 1 ? 'план' : p.yearsCount < 5 ? 'плана' : 'планов'}</span>
                                        </div>
                                        <div className={styles.programStat}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2l-5 2.5 5 2.5 5-2.5L7 2z" stroke="currentColor" strokeWidth="1.2" /><path d="M2 7.5l5 2.5 5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                            <span>{p.coursesCount} дисциплин</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.programCardArrow}>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </button>
                        ))}

                        {/* Create card */}
                        <button className={styles.createCard} onClick={() => setShowCreateProgram(true)}>
                            <div className={styles.createCardIcon}>
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 7v14M7 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </div>
                            <span className={styles.createCardText}>Создать программу</span>
                            <span className={styles.createCardHint}>Добавить новую образовательную программу</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Years View ── */}
            {view === 'years' && selectedProgram && (
                <div className={styles.gridView}>
                    <div className={styles.gridHeader}>
                        <div>
                            <h1 className={styles.gridTitle}>{selectedProgram.name}</h1>
                            <p className={styles.gridSubtitle}>Выберите год набора. Можно выбрать до 2 планов для сравнения.</p>
                        </div>
                        <button
                            className={styles.openGraphBtn}
                            disabled={selectedYears.length === 0}
                            onClick={handleOpenGraph}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                {isCompare ? (
                                    <>
                                        <rect x="1" y="2" width="6.5" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                                        <rect x="10.5" y="2" width="6.5" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                                    </>
                                ) : (
                                    <><path d="M3 3h12v12H3z" stroke="currentColor" strokeWidth="1.3" rx="2" /><circle cx="7" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="11" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M8.2 9.8l1.6-1.6" stroke="currentColor" strokeWidth="1.2" /></>
                                )}
                            </svg>
                            {isCompare ? 'Сравнить планы' : selectedYears.length === 1 ? 'Открыть граф' : 'Выберите план'}
                        </button>
                    </div>

                    {selectedYears.length > 0 && (
                        <div className={styles.selectionBar}>
                            <span className={styles.selectionBarLabel}>Выбрано:</span>
                            {selectedYears.map((y) => (
                                <span key={y.id} className={styles.selectionChip}>
                                    {y.label}
                                    <button className={styles.selectionChipRemove} onClick={() => setSelectedYears((prev) => prev.filter((p) => p.id !== y.id))}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    </button>
                                </span>
                            ))}
                            {selectedYears.length === 1 && (
                                <span className={styles.selectionHint}>+ выберите ещё один для сравнения</span>
                            )}
                        </div>
                    )}

                    <div className={styles.cardGrid}>
                        {(allYears[selectedProgram.id] || []).map((yp) => {
                            const isSelected = selectedYears.some((y) => y.id === yp.id);
                            const sc = statusConfig[yp.status];
                            return (
                                <button
                                    key={yp.id}
                                    className={`${styles.yearCard} ${isSelected ? styles.yearCardSelected : ''}`}
                                    onClick={() => handleToggleYear(yp)}
                                >
                                    {isSelected && (
                                        <div className={styles.yearCardCheck}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    )}
                                    <div className={styles.yearCardTop}>
                                        <span className={styles.yearNumber}>{yp.year}</span>
                                        <span className={styles.yearStatus} style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                                    </div>
                                    <span className={styles.yearLabel}>{yp.label}</span>
                                    <div className={styles.yearStats}>
                                        <div className={styles.yearStat}>
                                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2l-4.5 2.25 4.5 2.25 4.5-2.25L6.5 2z" stroke="currentColor" strokeWidth="1.1" /><path d="M2 7l4.5 2.25L11 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
                                            {yp.coursesCount} дисц.
                                        </div>
                                        <div className={styles.yearStat}>
                                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.1" /><path d="M2.5 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
                                            {yp.studentsCount} студ.
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        <button className={styles.createCard} onClick={() => setShowCreateYear(true)}>
                            <div className={styles.createCardIcon}>
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 7v14M7 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </div>
                            <span className={styles.createCardText}>Добавить год набора</span>
                            <span className={styles.createCardHint}>Создать новый учебный план</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Graph View ── */}
            {view === 'graph' && selectedProgram && selectedYears.length > 0 && (
                <div className={`${styles.graphView} ${isCompare ? styles.graphViewCompare : ''}`}>
                    {/* Legend (floating) */}
                    <div className={styles.legendFloat}>
                        <div className={styles.legendItems}>
                            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#135BEC' }} /><span>Обязательно</span></div>
                            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#F59E0B' }} /><span>По выбору</span></div>
                            <div className={styles.legendItem}><span className={styles.legendLine} /><span>Связь</span></div>
                        </div>
                    </div>

                    <GraphPanel
                        label={selectedYears[0].label}
                        labelColor={selectedProgram.color}
                        initNodes={nodesVariantA}
                        initEdges={edgesMain}
                        details={detailsA}
                        onSelectCourse={setSelectedCourse}
                        onDetailsChange={setDetailsA}
                        compact={isCompare}
                    />

                    {isCompare && (
                        <>
                            <div className={styles.compareDivider}>
                                <span className={styles.compareDividerLabel}>VS</span>
                            </div>
                            <GraphPanel
                                label={selectedYears[1].label}
                                labelColor="#D97706"
                                initNodes={nodesVariantB}
                                initEdges={edgesVariantB}
                                details={detailsB}
                                onSelectCourse={setSelectedCourse}
                                onDetailsChange={setDetailsB}
                                compact
                            />
                        </>
                    )}
                </div>
            )}

            {/* Back button */}
            {view !== 'programs' && (
                <button className={styles.backBtn} onClick={handleBack}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Назад
                </button>
            )}

            {/* Course detail panel */}
            {selectedCourse && (
                <CourseDetailPanel course={selectedCourse} onClose={() => setSelectedCourse(null)} onSave={handleSave} />
            )}

            {/* Create modals */}
            {showCreateProgram && (
                <CreateProgramModal
                    onClose={() => setShowCreateProgram(false)}
                    onCreate={(p) => { setAllPrograms((prev) => [...prev, p]); setShowCreateProgram(false); }}
                />
            )}
            {showCreateYear && selectedProgram && (
                <CreateYearModal
                    onClose={() => setShowCreateYear(false)}
                    existingYears={(allYears[selectedProgram.id] || []).map((y) => y.year)}
                    onCreate={(y) => { setAllYears((prev) => ({ ...prev, [selectedProgram.id]: [...(prev[selectedProgram.id] || []), y] })); setShowCreateYear(false); }}
                />
            )}
        </div>
    );
};

export default DashboardPage;
