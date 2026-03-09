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
import CourseNode, { type CourseNodeData } from '../components/CourseNode';
import CourseDetailPanel, { type CourseDetail } from '../components/CourseDetailPanel';

/* ── Mock course details ── */
const courseDetails: Record<string, CourseDetail> = {
    cs201: {
        id: 'cs201',
        code: 'CS-201',
        name: 'Структуры данных и алгоритмы',
        semester: 'Осенний семестр',
        type: 'required',
        credits: 4,
        summary:
            'Курс охватывает фундаментальные структуры данных, включая стеки, очереди, деревья и графы. Студенты изучат анализ алгоритмов (О-нотация) и будут применять эти концепции для решения сложных вычислительных задач.',
        students: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Ann1&backgroundColor=b6e3f4',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Dima2&backgroundColor=c0aede',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Katya3&backgroundColor=ffd5dc',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan4&backgroundColor=b6e3f4',
            ],
            total: 46,
        },
        teachers: [
            {
                name: 'Д-р Роберт Чен',
                role: 'Старший лектор',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrChen&backgroundColor=ffd5dc',
            },
        ],
        materials: [
            { name: 'Учебный_план_2024.pdf', size: '1.2 МБ', date: '2 дня назад', type: 'pdf' },
            { name: 'Лекция_1_Слайды.pptx', size: '4.5 МБ', date: 'Вчера', type: 'pptx' },
            { name: 'Лабораторная_1.zip', size: '500 КБ', date: 'Сегодня', type: 'code' },
        ],
    },
    cs101: {
        id: 'cs101',
        code: 'CS-101',
        name: 'Введение в программирование',
        semester: 'Осенний семестр',
        type: 'required',
        credits: 6,
        summary:
            'Основы программирования на языке Python. Переменные, условия, циклы, функции, работа с файлами и базовые алгоритмы. Введение в объектно-ориентированное программирование.',
        students: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Stud1&backgroundColor=ffd5dc',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Stud2&backgroundColor=c0aede',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Stud3&backgroundColor=b6e3f4',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Stud4&backgroundColor=ffd5dc',
            ],
            total: 120,
        },
        teachers: [
            {
                name: 'Проф. Алексей Иванов',
                role: 'Профессор',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfIvanov&backgroundColor=b6e3f4',
            },
        ],
        materials: [
            { name: 'Программа_курса.pdf', size: '800 КБ', date: '1 нед. назад', type: 'pdf' },
            { name: 'Python_Основы.pptx', size: '3.2 МБ', date: '3 дня назад', type: 'pptx' },
        ],
    },
    mth202: {
        id: 'mth202',
        code: 'MTH-202',
        name: 'Линейная алгебра',
        semester: 'Весенний семестр',
        type: 'core',
        credits: 4,
        summary:
            'Матрицы, определители, системы линейных уравнений. Векторные пространства и линейные отображения. Собственные значения и собственные векторы.',
        students: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=M1&backgroundColor=c0aede',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=M2&backgroundColor=b6e3f4',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=M3&backgroundColor=ffd5dc',
            ],
            total: 85,
        },
        teachers: [
            {
                name: 'Доц. Мария Петрова',
                role: 'Доцент',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DocPetrova&backgroundColor=c0aede',
            },
        ],
        materials: [
            { name: 'Лекции_ЛинАлгебра.pdf', size: '6.1 МБ', date: '5 дней назад', type: 'pdf' },
        ],
    },
    cs301: {
        id: 'cs301',
        code: 'CS-301',
        name: 'Базы данных',
        semester: 'Весенний семестр',
        type: 'required',
        credits: 4,
        summary:
            'Реляционные базы данных, SQL, нормализация, индексирование. Введение в NoSQL-системы. Проектирование схем и оптимизация запросов.',
        students: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=DB1&backgroundColor=b6e3f4',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=DB2&backgroundColor=ffd5dc',
            ],
            total: 38,
        },
        teachers: [
            {
                name: 'Д-р Олег Сидоров',
                role: 'Старший преподаватель',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrSidorov&backgroundColor=b6e3f4',
            },
        ],
        materials: [
            { name: 'SQL_Практикум.pdf', size: '2.3 МБ', date: 'Вчера', type: 'pdf' },
            { name: 'ER_Диаграммы.pptx', size: '1.8 МБ', date: '4 дня назад', type: 'pptx' },
        ],
    },
    cs401: {
        id: 'cs401',
        code: 'CS-401',
        name: 'Машинное обучение',
        semester: 'Осенний семестр',
        type: 'elective',
        credits: 5,
        summary:
            'Основы ML: регрессия, классификация, кластеризация, нейронные сети. Практическая работа с scikit-learn и PyTorch.',
        students: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=ML1&backgroundColor=c0aede',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=ML2&backgroundColor=ffd5dc',
            ],
            total: 28,
        },
        teachers: [
            {
                name: 'Проф. Елена Козлова',
                role: 'Профессор',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfKozlova&backgroundColor=ffd5dc',
            },
        ],
        materials: [
            { name: 'ML_Учебник.pdf', size: '12 МБ', date: '1 нед. назад', type: 'pdf' },
            { name: 'Jupyter_Notebooks.zip', size: '8.4 МБ', date: 'Сегодня', type: 'code' },
        ],
    },
    mth101: {
        id: 'mth101',
        code: 'MTH-101',
        name: 'Математический анализ',
        semester: 'Осенний семестр',
        type: 'core',
        credits: 5,
        summary:
            'Пределы, производные, интегралы. Ряды и дифференциальные уравнения. Основы многомерного анализа.',
        students: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=MA1&backgroundColor=b6e3f4',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=MA2&backgroundColor=c0aede',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=MA3&backgroundColor=ffd5dc',
            ],
            total: 140,
        },
        teachers: [
            {
                name: 'Проф. Виктор Смирнов',
                role: 'Профессор',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfSmirnov&backgroundColor=b6e3f4',
            },
        ],
        materials: [
            { name: 'Матанализ_Лекции.pdf', size: '9.5 МБ', date: '3 дня назад', type: 'pdf' },
        ],
    },
    cs302: {
        id: 'cs302',
        code: 'CS-302',
        name: 'Компьютерные сети',
        semester: 'Весенний семестр',
        type: 'required',
        credits: 3,
        summary:
            'Модели OSI и TCP/IP. Протоколы маршрутизации, DNS, HTTP/HTTPS. Безопасность сетей и криптография.',
        students: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Net1&backgroundColor=c0aede',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Net2&backgroundColor=b6e3f4',
            ],
            total: 32,
        },
        teachers: [
            {
                name: 'Доц. Андрей Волков',
                role: 'Доцент',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DocVolkov&backgroundColor=b6e3f4',
            },
        ],
        materials: [
            { name: 'Сети_Практикум.pdf', size: '3.2 МБ', date: 'Вчера', type: 'pdf' },
            { name: 'Wireshark_Лаба.zip', size: '1.1 МБ', date: 'Сегодня', type: 'code' },
        ],
    },
};

/* ── React Flow Nodes ── */
const initialNodes: Node<CourseNodeData>[] = [
    {
        id: 'cs101',
        type: 'courseNode',
        position: { x: 100, y: 400 },
        data: { code: 'CS-101', name: 'Введение в\nпрограммирование', credits: 6, type: 'required', semester: '1 семестр' },
    },
    {
        id: 'mth101',
        type: 'courseNode',
        position: { x: 500, y: 450 },
        data: { code: 'MTH-101', name: 'Математический\nанализ', credits: 5, type: 'core', semester: '1 семестр' },
    },
    {
        id: 'cs201',
        type: 'courseNode',
        position: { x: 250, y: 220 },
        data: { code: 'CS-201', name: 'Структуры данных и\nалгоритмы', credits: 4, type: 'required', semester: '2 семестр' },
    },
    {
        id: 'mth202',
        type: 'courseNode',
        position: { x: 500, y: 580 },
        data: { code: 'MTH-202', name: 'Линейная алгебра', credits: 4, type: 'core', semester: '2 семестр' },
    },
    {
        id: 'cs301',
        type: 'courseNode',
        position: { x: 50, y: 50 },
        data: { code: 'CS-301', name: 'Базы данных', credits: 4, type: 'required', semester: '3 семестр' },
    },
    {
        id: 'cs302',
        type: 'courseNode',
        position: { x: 450, y: 50 },
        data: { code: 'CS-302', name: 'Компьютерные сети', credits: 3, type: 'required', semester: '3 семестр' },
    },
    {
        id: 'cs401',
        type: 'courseNode',
        position: { x: 250, y: -130 },
        data: { code: 'CS-401', name: 'Машинное обучение', credits: 5, type: 'elective', semester: '4 семестр' },
    },
];

const initialEdges: Edge[] = [
    { id: 'e-cs101-cs201', source: 'cs101', target: 'cs201', type: 'deletable', animated: false, style: { stroke: '#CBD5E1', strokeWidth: 2 } },
    { id: 'e-cs201-cs301', source: 'cs201', target: 'cs301', type: 'deletable', animated: false, style: { stroke: '#CBD5E1', strokeWidth: 2 } },
    { id: 'e-cs201-cs302', source: 'cs201', target: 'cs302', type: 'deletable', animated: false, style: { stroke: '#CBD5E1', strokeWidth: 2 } },
    { id: 'e-cs201-cs401', source: 'cs201', target: 'cs401', type: 'deletable', animated: false, style: { stroke: '#CBD5E1', strokeWidth: 2 } },
    { id: 'e-mth101-mth202', source: 'mth101', target: 'mth202', type: 'deletable', animated: false, style: { stroke: '#CBD5E1', strokeWidth: 2 } },
    { id: 'e-mth101-cs201', source: 'mth101', target: 'cs201', type: 'deletable', animated: false, style: { stroke: '#CBD5E1', strokeWidth: 2 } },
    { id: 'e-mth202-cs401', source: 'mth202', target: 'cs401', type: 'deletable', animated: false, style: { stroke: '#CBD5E1', strokeWidth: 2 } },
];

/* ── Deletable edge with ×-button on hover ── */
const DeletableEdge: React.FC<EdgeProps> = ({
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style,
}) => {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

    return (
        <>
            <BaseEdge path={edgePath} style={style} />
            <EdgeLabelRenderer>
                <button
                    className="edge-delete-btn"
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    onClick={() => setEdges((eds) => eds.filter((e) => e.id !== id))}
                >
                    ×
                </button>
            </EdgeLabelRenderer>
        </>
    );
};

/* ── Add-node form default state ── */
const defaultForm = { code: '', name: '', credits: 3, type: 'required' as CourseNodeData['type'], semester: '' };

/* ── Inner component (has access to useReactFlow) ── */
const DashboardPageInner: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
    const [details, setDetails] = useState(courseDetails);
    const { screenToFlowPosition } = useReactFlow();

    /* context menu */
    const [menu, setMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    /* add-node dialog */
    const [dialog, setDialog] = useState(false);
    const [pendingPos, setPendingPos] = useState({ x: 0, y: 0 });
    const [form, setForm] = useState(defaultForm);

    const nodeTypes = useMemo(() => ({ courseNode: CourseNode }), []);
    const edgeTypes = useMemo(() => ({ deletable: DeletableEdge }), []);

    /* close context menu on outside click */
    useEffect(() => {
        if (!menu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Element)) {
                setMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menu]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        const detail = details[node.id];
        if (detail) setSelectedCourse(detail);
    }, [details]);

    const onConnect = useCallback((connection: Connection) => {
        setEdges((eds) => addEdge(
            { ...connection, type: 'deletable', animated: false, style: { stroke: '#CBD5E1', strokeWidth: 2 } },
            eds,
        ));
    }, [setEdges]);

    const onPaneClick = useCallback(() => {
        setSelectedCourse(null);
        setMenu(null);
    }, []);

    const onPaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
        e.preventDefault();
        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setMenu({ x: e.clientX, y: e.clientY, flowX: flowPos.x, flowY: flowPos.y });
    }, [screenToFlowPosition]);

    const openAddDialog = useCallback(() => {
        if (!menu) return;
        setPendingPos({ x: menu.flowX, y: menu.flowY });
        setForm(defaultForm);
        setMenu(null);
        setDialog(true);
    }, [menu]);

    const handleAddNode = useCallback(() => {
        if (!form.name.trim()) return;
        const id = `course-${Date.now()}`;
        const data: CourseNodeData = {
            code: form.code.trim(),
            name: form.name.trim(),
            credits: form.credits,
            type: form.type,
            semester: form.semester.trim(),
        };
        const newNode: Node<CourseNodeData> = { id, type: 'courseNode', position: pendingPos, data };
        const newDetail: CourseDetail = {
            id,
            code: data.code,
            name: data.name,
            semester: data.semester,
            type: data.type,
            credits: data.credits,
            summary: '',
            students: { avatars: [], total: 0 },
            teachers: [],
            materials: [],
        };
        setNodes((prev) => [...prev, newNode]);
        setDetails((prev) => ({ ...prev, [id]: newDetail }));
        setDialog(false);
    }, [form, pendingPos, setNodes]);

    const handleSave = useCallback((updated: CourseDetail) => {
        setDetails((prev) => ({ ...prev, [updated.id]: updated }));
        setSelectedCourse(updated);
        setNodes((nds) => nds.map((n) =>
            n.id !== updated.id ? n : {
                ...n,
                data: { ...n.data, code: updated.code, name: updated.name, credits: updated.credits, type: updated.type, semester: updated.semester },
            }
        ));
    }, [setNodes]);

    return (
        <div className="dashboard-page">
            {/* Left panel — selectors */}
            <div className="dashboard-controls">
                <div className="dashboard-control-card">
                    <div className="control-card-header">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 4l-7 3.5 7 3.5 7-3.5L10 4z" fill="#135BEC" />
                            <path d="M3 11l7 3.5 7-3.5" stroke="#135BEC" strokeWidth="1.3" strokeLinecap="round" />
                            <path d="M3 14.5l7 3.5 7-3.5" stroke="#135BEC" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <span>Выбор программы</span>
                    </div>
                    <label className="control-label">УЧЕБНАЯ ПРОГРАММА</label>
                    <div className="control-select-wrapper">
                        <svg className="control-select-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <select className="control-select">
                            <option>Компьютерные науки (B.Sc.)</option>
                            <option>Информационные системы (B.Sc.)</option>
                            <option>Прикладная математика (B.Sc.)</option>
                        </select>
                        <svg className="control-select-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    </div>

                    <label className="control-label">УЧЕБНЫЙ ГОД</label>
                    <div className="control-select-wrapper">
                        <select className="control-select control-select-no-icon">
                            <option>2023/2024</option>
                            <option>2024/2025</option>
                            <option>2022/2023</option>
                        </select>
                        <svg className="control-select-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                <div className="dashboard-control-card">
                    <div className="control-card-header">
                        <span>ЛЕГЕНДА ГРАФА</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6.5" stroke="#94A3B8" strokeWidth="1.2" />
                            <path d="M8 5v.5M8 7.5v3" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="legend-items">
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: '#135BEC' }} />
                            <span>Обязательно</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: '#F59E0B' }} />
                            <span>По выбору</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-line" />
                            <span>Связь</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graph container */}
            <div className="dashboard-graph-wrapper">
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
                    <Controls showInteractive={false} />
                </ReactFlow>
            </div>

            {/* Context menu */}
            {menu && (
                <div
                    ref={menuRef}
                    className="flow-context-menu"
                    style={{ top: menu.y, left: menu.x }}
                >
                    <button className="flow-context-menu-item" onClick={openAddDialog}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Добавить предмет
                    </button>
                </div>
            )}

            {/* Add-node dialog */}
            {dialog && (
                <div className="flow-dialog-overlay" onClick={() => setDialog(false)}>
                    <div className="flow-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="flow-dialog-header">
                            <span>Новый предмет</span>
                            <button className="flow-dialog-close" onClick={() => setDialog(false)}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="flow-dialog-body">
                            <label className="flow-dialog-label">НАЗВАНИЕ *</label>
                            <input
                                className="flow-dialog-input"
                                placeholder="Например: Операционные системы"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                autoFocus
                            />

                            <label className="flow-dialog-label">КОД КУРСА</label>
                            <input
                                className="flow-dialog-input"
                                placeholder="Например: CS-303"
                                value={form.code}
                                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                            />

                            <div className="flow-dialog-row">
                                <div className="flow-dialog-field">
                                    <label className="flow-dialog-label">ТИП</label>
                                    <select
                                        className="flow-dialog-select"
                                        value={form.type}
                                        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CourseNodeData['type'] }))}
                                    >
                                        <option value="required">Обязательный</option>
                                        <option value="elective">По выбору</option>
                                        <option value="core">Базовый</option>
                                    </select>
                                </div>
                                <div className="flow-dialog-field">
                                    <label className="flow-dialog-label">КРЕДИТЫ</label>
                                    <input
                                        className="flow-dialog-input"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={form.credits}
                                        onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>

                            <label className="flow-dialog-label">СЕМЕСТР</label>
                            <input
                                className="flow-dialog-input"
                                placeholder="Например: 3 семестр"
                                value={form.semester}
                                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                            />
                        </div>

                        <div className="flow-dialog-footer">
                            <button className="flow-dialog-btn-cancel" onClick={() => setDialog(false)}>Отмена</button>
                            <button
                                className="flow-dialog-btn-submit"
                                onClick={handleAddNode}
                                disabled={!form.name.trim()}
                            >
                                Добавить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail panel */}
            {selectedCourse && (
                <CourseDetailPanel
                    course={selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

const DashboardPage: React.FC = () => (
    <ReactFlowProvider>
        <DashboardPageInner />
    </ReactFlowProvider>
);

export default DashboardPage;
