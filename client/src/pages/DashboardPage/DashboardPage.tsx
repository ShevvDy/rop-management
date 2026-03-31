import React, { useState, useCallback, useMemo, useRef, useEffect, createContext, useContext } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    Panel,
    useNodesState,
    useEdgesState,
    useReactFlow,
    addEdge,
    reconnectEdge,
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type Node,
    type Edge,
    type EdgeProps,
    type NodeProps,
    type Connection,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import CourseNode, { type CourseNodeData } from '../../components/CourseNode';
import CourseDetailPanel, { type CourseDetail } from '../../components/CourseDetailPanel';
import styles from './DashboardPage.module.css';

/* ═══════════════════════════════════════════
   Dagre auto-layout
   ═══════════════════════════════════════════ */
const NODE_WIDTH = 230;
const NODE_BASE_HEIGHT = 110;
const LINE_HEIGHT = 18;
const NAME_CHARS_PER_LINE = 18;

const estimateNodeHeight = (node: Node<CourseNodeData>) => {
    const name = node.data?.name ?? '';
    const lines = Math.max(1, Math.ceil(name.length / NAME_CHARS_PER_LINE));
    return NODE_BASE_HEIGHT + (lines - 1) * LINE_HEIGHT;
};

const getLayoutedElements = (nodes: Node<CourseNodeData>[], edges: Edge[], direction: 'TB' | 'BT' | 'LR' | 'RL' = 'BT') => {
    const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100, edgesep: 40, align: 'UL' });
    nodes.forEach((node) => {
        const h = estimateNodeHeight(node);
        g.setNode(node.id, { width: NODE_WIDTH, height: h });
    });
    edges.forEach((edge) => g.setEdge(edge.source, edge.target));
    dagre.layout(g);

    const isHorizontal = direction === 'LR' || direction === 'RL';
    const layoutedNodes = nodes.map((node) => {
        const pos = g.node(node.id);
        return {
            ...node,
            position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - pos.height / 2 },
            targetPosition: isHorizontal ? Position.Left : Position.Bottom,
            sourcePosition: isHorizontal ? Position.Right : Position.Top,
        };
    });
    return { nodes: layoutedNodes, edges: [...edges] };
};

/* ═══════════════════════════════════════════
   Validation: check graph connectivity
   - ВКР node: must have at least one incoming edge
   - All other nodes: must have at least one outgoing edge (leading towards ВКР)
   ═══════════════════════════════════════════ */
const VKR_NODE_ID = 'vkr';

const findInvalidNodes = (nodes: Node[], edges: Edge[]): string[] => {
    if (nodes.length <= 1) return [];
    const sources = new Set<string>();
    const targets = new Set<string>();
    edges.forEach((e) => { sources.add(e.source); targets.add(e.target); });

    return nodes.filter((n) => {
        if (n.id === VKR_NODE_ID) {
            // ВКР must have at least one incoming edge
            return !targets.has(n.id);
        }
        // All other nodes must have at least one outgoing edge
        return !sources.has(n.id);
    }).map((n) => n.id);
};

/* ═══════════════════════════════════════════
   Graph edit context (orphan tracking + node deletion)
   ═══════════════════════════════════════════ */
/* ── Diff types for compare mode ── */
type DiffStatus = 'same' | 'added' | 'removed';

interface DiffInfo {
    nodes: Record<string, DiffStatus>;
    edges: Record<string, DiffStatus>;
}

const computeDiff = (
    nodesA: Node<CourseNodeData>[], edgesA: Edge[],
    nodesB: Node<CourseNodeData>[], edgesB: Edge[],
): { diffA: DiffInfo; diffB: DiffInfo } => {
    const nodeIdsA = new Set(nodesA.map((n) => n.id));
    const nodeIdsB = new Set(nodesB.map((n) => n.id));
    const edgeKeyA = new Set(edgesA.map((e) => `${e.source}->${e.target}`));
    const edgeKeyB = new Set(edgesB.map((e) => `${e.source}->${e.target}`));

    const diffA: DiffInfo = { nodes: {}, edges: {} };
    const diffB: DiffInfo = { nodes: {}, edges: {} };

    nodesA.forEach((n) => { diffA.nodes[n.id] = nodeIdsB.has(n.id) ? 'same' : 'added'; });
    nodesB.forEach((n) => { diffB.nodes[n.id] = nodeIdsA.has(n.id) ? 'same' : 'added'; });

    edgesA.forEach((e) => {
        const k = `${e.source}->${e.target}`;
        diffA.edges[e.id] = edgeKeyB.has(k) ? 'same' : 'added';
    });
    edgesB.forEach((e) => {
        const k = `${e.source}->${e.target}`;
        diffB.edges[e.id] = edgeKeyA.has(k) ? 'same' : 'added';
    });

    // Mark nodes from the OTHER side that are missing in THIS side
    nodesB.forEach((n) => { if (!nodeIdsA.has(n.id)) diffA.nodes[`missing-${n.id}`] = 'removed'; });
    nodesA.forEach((n) => { if (!nodeIdsB.has(n.id)) diffB.nodes[`missing-${n.id}`] = 'removed'; });

    return { diffA, diffB };
};

const GraphEditContext = createContext<{
    invalidIds: string[];
    onDeleteNode: (id: string) => void;
    onDeleteEdge: (id: string) => void;
    readOnly: boolean;
    diff: DiffInfo | null;
}>({ invalidIds: [], onDeleteNode: () => {}, onDeleteEdge: () => {}, readOnly: false, diff: null });

type CourseNodeType = Node<CourseNodeData>;

function DeletableCourseNode(props: NodeProps<CourseNodeType>) {
    const { invalidIds, onDeleteNode, readOnly, diff } = useContext(GraphEditContext);
    const isInvalid = !readOnly && invalidIds.includes(props.id);
    const isVkr = props.id === VKR_NODE_ID;

    const diffStatus = diff?.nodes[props.id];
    const diffClass = diffStatus === 'added' ? styles.nodeDiffAdded
        : diffStatus === 'removed' ? styles.nodeDiffRemoved
        : (diff && diffStatus === 'same') ? styles.nodeDiffSame : '';

    return (
        <div className={`${styles.nodeWrapper} ${isInvalid ? styles.nodeOrphan : ''} ${diffClass}`}>
            <CourseNode {...props} />
            {!readOnly && !isVkr && (
                <button
                    className={styles.nodeDeleteBtn}
                    onClick={(e) => { e.stopPropagation(); onDeleteNode(props.id); }}
                    title="Удалить предмет"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
            )}
            {isInvalid && (
                <div className={styles.nodeOrphanBadge}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l5 10H1L6 1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><path d="M6 4.5v2M6 8v.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
                    {isVkr ? 'Нет входящих' : 'Нет исходящих'}
                </div>
            )}
            {diffStatus === 'added' && (
                <div className={styles.nodeDiffBadge} data-status="added">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    Только здесь
                </div>
            )}
        </div>
    );
}

function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition: sp, targetPosition: tp, style: edgeStyleProp }: EdgeProps) {
    const { onDeleteEdge, readOnly, diff } = useContext(GraphEditContext);
    const [edgePath, lx, ly] = getSmoothStepPath({ sourceX, sourceY, sourcePosition: sp, targetX, targetY, targetPosition: tp });

    const diffStatus = diff?.edges[id];
    const diffEdgeStyle = diff
        ? diffStatus === 'added'
            ? { ...edgeStyleProp, stroke: '#16A34A', strokeWidth: 3 }
            : { ...edgeStyleProp, stroke: '#D1D5DB', strokeWidth: 1.5, opacity: 0.6 }
        : edgeStyleProp;

    return (
        <>
            <BaseEdge path={edgePath} style={diffEdgeStyle} />
            <EdgeLabelRenderer>
                {!readOnly && (
                    <button className={styles.edgeDeleteBtn} style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${lx}px,${ly}px)`, pointerEvents: 'all' }} onClick={(e) => { e.stopPropagation(); onDeleteEdge(id); }}>×</button>
                )}
                {diffStatus === 'added' && (
                    <div className={styles.edgeDiffBadge} style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${lx}px,${ly + 16}px)`, pointerEvents: 'none' }}>
                        Новая связь
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
}

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
    cs101: { id: 'cs101', code: 'CS-101', name: 'Введение в программирование', semester: 'Осенний семестр', type: 'required', credits: 6, summary: 'Основы программирования на Python. Переменные, условия, циклы, функции, работа с файлами.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Stud1&backgroundColor=ffd5dc', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stud2&backgroundColor=c0aede', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stud3&backgroundColor=b6e3f4'], total: 120 }, teachers: [{ name: 'Проф. Алексей Иванов', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfIvanov&backgroundColor=b6e3f4' }], materials: [{ name: 'Программа_курса.pdf', size: '800 КБ', date: '1 нед. назад', type: 'pdf' }] },
    mth101: { id: 'mth101', code: 'MTH-101', name: 'Математический анализ', semester: 'Осенний семестр', type: 'required', credits: 5, summary: 'Пределы, производные, интегралы. Ряды и дифференциальные уравнения.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=MA1&backgroundColor=b6e3f4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MA2&backgroundColor=c0aede'], total: 140 }, teachers: [{ name: 'Проф. Виктор Смирнов', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfSmirnov&backgroundColor=b6e3f4' }], materials: [{ name: 'Матанализ_Лекции.pdf', size: '9.5 МБ', date: '3 дня назад', type: 'pdf' }] },
    mth102: { id: 'mth102', code: 'MTH-102', name: 'Дискретная математика', semester: 'Осенний семестр', type: 'required', credits: 4, summary: 'Логика, множества, комбинаторика, теория графов. Основы для алгоритмов.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=DM1&backgroundColor=c0aede', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DM2&backgroundColor=ffd5dc'], total: 115 }, teachers: [{ name: 'Доц. Ирина Белова', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DocBelova&backgroundColor=ffd5dc' }], materials: [{ name: 'Дискретка_Конспект.pdf', size: '3.8 МБ', date: '4 дня назад', type: 'pdf' }] },
    cs201: { id: 'cs201', code: 'CS-201', name: 'Алгоритмы и структуры данных', semester: 'Весенний семестр', type: 'required', credits: 5, summary: 'Фундаментальные структуры данных: стеки, очереди, деревья, графы. Анализ сложности.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Ann1&backgroundColor=b6e3f4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dima2&backgroundColor=c0aede', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Katya3&backgroundColor=ffd5dc'], total: 96 }, teachers: [{ name: 'Д-р Роберт Чен', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrChen&backgroundColor=ffd5dc' }], materials: [{ name: 'Учебный_план_2024.pdf', size: '1.2 МБ', date: '2 дня назад', type: 'pdf' }, { name: 'Лекция_1_Слайды.pptx', size: '4.5 МБ', date: 'Вчера', type: 'pptx' }] },
    mth202: { id: 'mth202', code: 'MTH-202', name: 'Линейная алгебра', semester: 'Весенний семестр', type: 'required', credits: 4, summary: 'Матрицы, определители, системы линейных уравнений. Векторные пространства.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=M1&backgroundColor=c0aede'], total: 85 }, teachers: [{ name: 'Доц. Мария Петрова', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DocPetrova&backgroundColor=c0aede' }], materials: [{ name: 'Лекции_ЛинАлгебра.pdf', size: '6.1 МБ', date: '5 дней назад', type: 'pdf' }] },
    cs301: { id: 'cs301', code: 'CS-301', name: 'Базы данных', semester: 'Осенний семестр', type: 'required', credits: 4, summary: 'Реляционные БД, SQL, нормализация, индексирование. Введение в NoSQL.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=DB1&backgroundColor=b6e3f4'], total: 38 }, teachers: [{ name: 'Д-р Олег Сидоров', role: 'Практик', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrSidorov&backgroundColor=b6e3f4' }], materials: [{ name: 'SQL_Практикум.pdf', size: '2.3 МБ', date: 'Вчера', type: 'pdf' }] },
    cs302: { id: 'cs302', code: 'CS-302', name: 'Компьютерные сети', semester: 'Осенний семестр', type: 'required', credits: 3, summary: 'Модели OSI и TCP/IP. Протоколы маршрутизации, DNS, HTTP/HTTPS.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Net1&backgroundColor=c0aede'], total: 32 }, teachers: [{ name: 'Доц. Андрей Волков', role: 'Практик', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DocVolkov&backgroundColor=b6e3f4' }], materials: [{ name: 'Сети_Практикум.pdf', size: '3.2 МБ', date: 'Вчера', type: 'pdf' }] },
    cs303: { id: 'cs303', code: 'CS-303', name: 'Операционные системы', semester: 'Осенний семестр', type: 'required', credits: 4, summary: 'Процессы, потоки, управление памятью, файловые системы. Ядро Linux.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=OS1&backgroundColor=b6e3f4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=OS2&backgroundColor=ffd5dc'], total: 35 }, teachers: [{ name: 'Проф. Дмитрий Кузнецов', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfKuznetsov&backgroundColor=b6e3f4' }], materials: [{ name: 'ОС_Лабораторные.pdf', size: '5.1 МБ', date: '3 дня назад', type: 'pdf' }] },
    cs401: { id: 'cs401', code: 'CS-401', name: 'Машинное обучение', semester: 'Весенний семестр', type: 'elective', credits: 5, summary: 'Основы ML: регрессия, классификация, кластеризация, нейронные сети.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=ML1&backgroundColor=c0aede'], total: 28 }, teachers: [{ name: 'Проф. Елена Козлова', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfKozlova&backgroundColor=ffd5dc' }], materials: [{ name: 'ML_Учебник.pdf', size: '12 МБ', date: '1 нед. назад', type: 'pdf' }] },
    cs402: { id: 'cs402', code: 'CS-402', name: 'Веб-разработка', semester: 'Весенний семестр', type: 'elective', credits: 4, summary: 'Полный стек: React, Node.js, REST API, развёртывание приложений.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Web1&backgroundColor=b6e3f4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Web2&backgroundColor=c0aede'], total: 42 }, teachers: [{ name: 'Доц. Никита Морозов', role: 'Практик', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DocMorozov&backgroundColor=c0aede' }], materials: [{ name: 'React_Гайд.pdf', size: '2.8 МБ', date: '2 дня назад', type: 'pdf' }] },
    cs403: { id: 'cs403', code: 'CS-403', name: 'Распределённые системы', semester: 'Весенний семестр', type: 'elective', credits: 5, summary: 'CAP-теорема, консенсус, репликация, шардирование. Kafka, gRPC.', students: { avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=DS1&backgroundColor=ffd5dc'], total: 22 }, teachers: [{ name: 'Проф. Сергей Новиков', role: 'Лектор', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfNovikov&backgroundColor=b6e3f4' }], materials: [{ name: 'Распред_Системы.pdf', size: '7.4 МБ', date: '5 дней назад', type: 'pdf' }] },
    [VKR_NODE_ID]: { id: VKR_NODE_ID, code: 'ВКР', name: 'Выпускная квалификационная работа', semester: '8 семестр', type: 'required', credits: 12, summary: 'Итоговая квалификационная работа. Самостоятельное исследование или проект под руководством научного руководителя.', students: { avatars: [], total: 0 }, teachers: [], materials: [] },
};

/*
   Graph structure (BT = bottom-to-top):

   ВКР (top):                          ВКР
                                      ↑     ↑
   Semester 4:        CS-401 Машинное обучение    CS-402 Веб-разработка
                            ↑         ↑                  ↑        ↑
   Semester 3:        CS-301 БД    CS-302 Сети    CS-303 Операционные системы
                         ↑    ↑       ↑              ↑
   Semester 2:        CS-201 Алгоритмы          MTH-202 Линейная алгебра
                       ↑        ↑                    ↑
   Semester 1 (bottom): CS-101 Программирование  MTH-101 Матанализ  MTH-102 Дискретная математика
*/

const p = { x: 0, y: 0 };

const nodesVariantA: Node<CourseNodeData>[] = [
    /* Семестр 1 — фундамент */
    { id: 'cs101',  type: 'courseNode', position: p, data: { code: 'CS-101',  name: 'Введение в программирование', credits: 6, type: 'required', semester: '1 семестр' } },
    { id: 'mth101', type: 'courseNode', position: p, data: { code: 'MTH-101', name: 'Математический анализ',       credits: 5, type: 'required',     semester: '1 семестр' } },
    { id: 'mth102', type: 'courseNode', position: p, data: { code: 'MTH-102', name: 'Дискретная математика',        credits: 4, type: 'required',     semester: '1 семестр' } },
    /* Семестр 2 */
    { id: 'cs201',  type: 'courseNode', position: p, data: { code: 'CS-201',  name: 'Алгоритмы и структуры данных', credits: 5, type: 'required', semester: '2 семестр' } },
    { id: 'mth202', type: 'courseNode', position: p, data: { code: 'MTH-202', name: 'Линейная алгебра',             credits: 4, type: 'required',     semester: '2 семестр' } },
    /* Семестр 3 */
    { id: 'cs301',  type: 'courseNode', position: p, data: { code: 'CS-301',  name: 'Базы данных',                  credits: 4, type: 'required', semester: '3 семестр' } },
    { id: 'cs302',  type: 'courseNode', position: p, data: { code: 'CS-302',  name: 'Компьютерные сети',            credits: 3, type: 'required', semester: '3 семестр' } },
    { id: 'cs303',  type: 'courseNode', position: p, data: { code: 'CS-303',  name: 'Операционные системы',         credits: 4, type: 'required', semester: '3 семестр' } },
    /* Семестр 4 — продвинутые */
    { id: 'cs401',  type: 'courseNode', position: p, data: { code: 'CS-401',  name: 'Машинное обучение',            credits: 5, type: 'elective', semester: '4 семестр' } },
    { id: 'cs402',  type: 'courseNode', position: p, data: { code: 'CS-402',  name: 'Веб-разработка',               credits: 4, type: 'elective', semester: '4 семестр' } },
    /* ВКР */
    { id: VKR_NODE_ID, type: 'courseNode', position: p, data: { code: 'ВКР', name: 'Выпускная квалификационная работа', credits: 12, type: 'required', semester: '8 семестр' } },
];

const nodesVariantB: Node<CourseNodeData>[] = [
    /* Семестр 1 */
    { id: 'cs101',  type: 'courseNode', position: p, data: { code: 'CS-101',  name: 'Введение в программирование', credits: 6, type: 'required', semester: '1 семестр' } },
    { id: 'mth101', type: 'courseNode', position: p, data: { code: 'MTH-101', name: 'Математический анализ',       credits: 5, type: 'required',     semester: '1 семестр' } },
    { id: 'mth102', type: 'courseNode', position: p, data: { code: 'MTH-102', name: 'Дискретная математика',        credits: 4, type: 'required',     semester: '1 семестр' } },
    /* Семестр 2 */
    { id: 'cs201',  type: 'courseNode', position: p, data: { code: 'CS-201',  name: 'Алгоритмы и структуры данных', credits: 5, type: 'required', semester: '2 семестр' } },
    { id: 'mth202', type: 'courseNode', position: p, data: { code: 'MTH-202', name: 'Линейная алгебра',             credits: 4, type: 'required',     semester: '2 семестр' } },
    /* Семестр 3 */
    { id: 'cs301',  type: 'courseNode', position: p, data: { code: 'CS-301',  name: 'Базы данных',                  credits: 4, type: 'required', semester: '3 семестр' } },
    { id: 'cs302',  type: 'courseNode', position: p, data: { code: 'CS-302',  name: 'Компьютерные сети',            credits: 3, type: 'required', semester: '3 семестр' } },
    { id: 'cs303',  type: 'courseNode', position: p, data: { code: 'CS-303',  name: 'Операционные системы',         credits: 4, type: 'required', semester: '3 семестр' } },
    /* Семестр 4 — альтернатива: вместо Веб-разработки — Распределённые системы */
    { id: 'cs401',  type: 'courseNode', position: p, data: { code: 'CS-401',  name: 'Машинное обучение',            credits: 5, type: 'elective', semester: '4 семестр' } },
    { id: 'cs403',  type: 'courseNode', position: p, data: { code: 'CS-403',  name: 'Распределённые системы',       credits: 5, type: 'elective', semester: '4 семестр' } },
    /* ВКР */
    { id: VKR_NODE_ID, type: 'courseNode', position: p, data: { code: 'ВКР', name: 'Выпускная квалификационная работа', credits: 12, type: 'required', semester: '8 семестр' } },
];

const edgeStyle = { stroke: '#CBD5E1', strokeWidth: 2 };

const edgesMain: Edge[] = [
    /* Семестр 1 → 2 */
    { id: 'e-cs101-cs201',  source: 'cs101',  target: 'cs201',  type: 'deletable', style: edgeStyle },
    { id: 'e-mth102-cs201', source: 'mth102', target: 'cs201',  type: 'deletable', style: edgeStyle },
    { id: 'e-mth101-mth202', source: 'mth101', target: 'mth202', type: 'deletable', style: edgeStyle },
    /* Семестр 2 → 3 */
    { id: 'e-cs201-cs301',  source: 'cs201',  target: 'cs301',  type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs302',  source: 'cs201',  target: 'cs302',  type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs303',  source: 'cs201',  target: 'cs303',  type: 'deletable', style: edgeStyle },
    /* Семестр 3 → 4 */
    { id: 'e-cs201-cs401',  source: 'cs201',  target: 'cs401',  type: 'deletable', style: edgeStyle },
    { id: 'e-mth202-cs401', source: 'mth202', target: 'cs401',  type: 'deletable', style: edgeStyle },
    { id: 'e-cs301-cs402',  source: 'cs301',  target: 'cs402',  type: 'deletable', style: edgeStyle },
    { id: 'e-cs302-cs402',  source: 'cs302',  target: 'cs402',  type: 'deletable', style: edgeStyle },
    /* → ВКР */
    { id: 'e-cs401-vkr',    source: 'cs401',  target: VKR_NODE_ID, type: 'deletable', style: edgeStyle },
    { id: 'e-cs402-vkr',    source: 'cs402',  target: VKR_NODE_ID, type: 'deletable', style: edgeStyle },
];

const edgesVariantB: Edge[] = [
    /* Семестр 1 → 2 */
    { id: 'e-cs101-cs201',  source: 'cs101',  target: 'cs201',  type: 'deletable', style: edgeStyle },
    { id: 'e-mth102-cs201', source: 'mth102', target: 'cs201',  type: 'deletable', style: edgeStyle },
    { id: 'e-mth101-mth202', source: 'mth101', target: 'mth202', type: 'deletable', style: edgeStyle },
    /* Семестр 2 → 3 */
    { id: 'e-cs201-cs301',  source: 'cs201',  target: 'cs301',  type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs302',  source: 'cs201',  target: 'cs302',  type: 'deletable', style: edgeStyle },
    { id: 'e-cs201-cs303',  source: 'cs201',  target: 'cs303',  type: 'deletable', style: edgeStyle },
    /* Семестр 3 → 4 */
    { id: 'e-cs201-cs401',  source: 'cs201',  target: 'cs401',  type: 'deletable', style: edgeStyle },
    { id: 'e-mth202-cs401', source: 'mth202', target: 'cs401',  type: 'deletable', style: edgeStyle },
    { id: 'e-cs302-cs403',  source: 'cs302',  target: 'cs403',  type: 'deletable', style: edgeStyle },
    { id: 'e-cs303-cs403',  source: 'cs303',  target: 'cs403',  type: 'deletable', style: edgeStyle },
    /* → ВКР */
    { id: 'e-cs401-vkr',    source: 'cs401',  target: VKR_NODE_ID, type: 'deletable', style: edgeStyle },
    { id: 'e-cs403-vkr',    source: 'cs403',  target: VKR_NODE_ID, type: 'deletable', style: edgeStyle },
];

/* ═══════════════════════════════════════════
   Status helpers
   ═══════════════════════════════════════════ */
const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    active: { label: 'Активный', bg: '#DCFCE7', color: '#16A34A' },
    draft: { label: 'Черновик', bg: '#FEF3C7', color: '#D97706' },
    archived: { label: 'Архив', bg: '#F1F5F9', color: '#64748B' },
};

/* Pre-layout initial data with dagre */
const { nodes: layoutedNodesA, edges: layoutedEdgesA } = getLayoutedElements(nodesVariantA, edgesMain);
const { nodes: layoutedNodesB, edges: layoutedEdgesB } = getLayoutedElements(nodesVariantB, edgesVariantB);

/* ── Default ВКР-only graph for new year plans ── */
const vkrOnlyNode: Node<CourseNodeData> = { id: VKR_NODE_ID, type: 'courseNode', position: { x: 0, y: 0 }, data: { code: 'ВКР', name: 'Выпускная квалификационная работа', credits: 12, type: 'required', semester: '8 семестр' } };
const emptyGraphNodes: Node<CourseNodeData>[] = [vkrOnlyNode];
const emptyGraphEdges: Edge[] = [];
const vkrDetail: CourseDetail = { id: VKR_NODE_ID, code: 'ВКР', name: 'Выпускная квалификационная работа', semester: '8 семестр', type: 'required', credits: 12, summary: 'Итоговая квалификационная работа. Самостоятельное исследование или проект под руководством научного руководителя.', students: { avatars: [], total: 0 }, teachers: [], materials: [] };

/* ── Per-year-plan graph data store ── */
interface YearGraphData {
    nodes: Node<CourseNodeData>[];
    edges: Edge[];
    details: Record<string, CourseDetail>;
}

const initialGraphStore: Record<string, YearGraphData> = {
    'se-2025': { nodes: layoutedNodesA, edges: layoutedEdgesA, details: courseDetails },
    'se-2024': { nodes: layoutedNodesA, edges: layoutedEdgesA, details: courseDetails },
    'se-2023': { nodes: layoutedNodesB, edges: layoutedEdgesB, details: courseDetails },
    'se-2022': { nodes: layoutedNodesB, edges: layoutedEdgesB, details: courseDetails },
    'cs-2024': { nodes: layoutedNodesA, edges: layoutedEdgesA, details: courseDetails },
    'cs-2023': { nodes: layoutedNodesB, edges: layoutedEdgesB, details: courseDetails },
    'cs-2022': { nodes: layoutedNodesA, edges: layoutedEdgesA, details: courseDetails },
    'ai-2024': { nodes: layoutedNodesA, edges: layoutedEdgesA, details: courseDetails },
    'ai-2023': { nodes: layoutedNodesB, edges: layoutedEdgesB, details: courseDetails },
    'ds-2024': { nodes: layoutedNodesA, edges: layoutedEdgesA, details: courseDetails },
    'ds-2023': { nodes: layoutedNodesB, edges: layoutedEdgesB, details: courseDetails },
    'is-2024': { nodes: layoutedNodesA, edges: layoutedEdgesA, details: courseDetails },
    'is-2023': { nodes: layoutedNodesB, edges: layoutedEdgesB, details: courseDetails },
    'is-2022': { nodes: layoutedNodesA, edges: layoutedEdgesA, details: courseDetails },
};

const getGraphDataForYear = (store: Record<string, YearGraphData>, yearId: string): YearGraphData => {
    return store[yearId] || { nodes: emptyGraphNodes, edges: emptyGraphEdges, details: { [VKR_NODE_ID]: vkrDetail } };
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
    readOnly?: boolean;
    diff?: DiffInfo | null;
}

const GraphPanelInner: React.FC<GraphPanelProps> = ({ label, labelColor, initNodes, initEdges, details, onSelectCourse, onDetailsChange, compact, readOnly = false, diff = null }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
    const { screenToFlowPosition, fitView } = useReactFlow();
    const [menu, setMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
    const [dialog, setDialog] = useState(false);
    const [pendingPos, setPendingPos] = useState({ x: 0, y: 0 });
    const [form, setForm] = useState({ code: '', name: '', credits: 3, type: 'required' as CourseNodeData['type'], semester: '' });
    const menuRef = useRef<HTMLDivElement>(null);

    /* ── Dirty state tracking ── */
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const markDirty = useCallback(() => setIsDirty(true), []);

    /* ── Invalid nodes tracking (reactive) ── */
    const invalidIds = useMemo(() => findInvalidNodes(nodes, edges), [nodes, edges]);
    const hasInvalid = invalidIds.length > 0;
    const invalidDescriptions = useMemo(() =>
        invalidIds.map((id) => {
            const n = nodes.find((nd) => nd.id === id);
            const name = n?.data?.name?.replace(/\n/g, ' ') || id;
            if (id === VKR_NODE_ID) return `${name} (нет входящих связей)`;
            return `${name} (нет исходящих связей)`;
        }), [invalidIds, nodes]);

    /* ── Delete node handler ── */
    const handleDeleteNode = useCallback((nodeId: string) => {
        if (nodeId === VKR_NODE_ID) return;
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        const newDetails = { ...details };
        delete newDetails[nodeId];
        onDetailsChange(newDetails);
        onSelectCourse(null);
        markDirty();
    }, [setNodes, setEdges, details, onDetailsChange, onSelectCourse, markDirty]);

    /* ── Delete edge handler ── */
    const handleDeleteEdge = useCallback((edgeId: string) => {
        setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        markDirty();
    }, [setEdges, markDirty]);

    const nodeTypes = useMemo(() => ({ courseNode: DeletableCourseNode }), []);
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

    const onConnect = useCallback((c: Connection) => {
        setEdges((eds) => addEdge({ ...c, type: 'deletable', style: edgeStyle }, eds));
        markDirty();
    }, [setEdges, markDirty]);

    /* ── Edge reconnect (drag handle to detach/reattach) ── */
    const edgeReconnectSuccessful = useRef(true);
    const onReconnectStart = useCallback(() => { edgeReconnectSuccessful.current = false; }, []);
    const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeReconnectSuccessful.current = true;
        setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
        markDirty();
    }, [setEdges, markDirty]);
    const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
        if (!edgeReconnectSuccessful.current) {
            setEdges((eds) => eds.filter((e) => e.id !== edge.id));
            markDirty();
        }
        edgeReconnectSuccessful.current = true;
    }, [setEdges, markDirty]);

    const onEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge) => {
        handleDeleteEdge(edge.id);
    }, [handleDeleteEdge]);

    const handleNodesChange: typeof onNodesChange = useCallback((changes) => {
        onNodesChange(changes);
        if (changes.some((c) => c.type === 'position' && (c as { dragging?: boolean }).dragging === false)) markDirty();
    }, [onNodesChange, markDirty]);

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
        markDirty();
    }, [form, pendingPos, setNodes, details, onDetailsChange, markDirty]);

    /* ── Dagre auto-layout ── */
    const onAutoLayout = useCallback((direction: 'BT' | 'LR' = 'BT') => {
        const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges, direction);
        setNodes([...ln]);
        setEdges([...le]);
        markDirty();
        requestAnimationFrame(() => fitView({ padding: 0.3 }));
    }, [nodes, edges, setNodes, setEdges, markDirty, fitView]);

    /* ── Save handler ── */
    const handleSaveGraph = useCallback(() => {
        setIsSaving(true);
        // Simulate API call — collect payload
        const _payload = {
            nodes: nodes.map((n) => ({ id: n.id, position: n.position, data: n.data })),
            edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
        };
        // TODO: POST to backend
        console.log('[Save graph]', _payload);
        setTimeout(() => {
            setIsSaving(false);
            setIsDirty(false);
        }, 600);
    }, [nodes, edges]);

    return (
        <GraphEditContext.Provider value={{ invalidIds, onDeleteNode: handleDeleteNode, onDeleteEdge: handleDeleteEdge, readOnly, diff }}>
        <div className={`${styles.graphPanel} ${compact ? styles.graphPanelCompact : ''}`}>
            <div className={styles.graphPanelLabel} style={labelColor ? { borderLeftColor: labelColor } : undefined}>
                {label}
                {readOnly && <span className={styles.readOnlyBadge}>Только просмотр</span>}
            </div>

            {/* Orphan warning banner */}
            {!readOnly && hasInvalid && (
                <div className={styles.orphanBanner}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l6.5 13H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    <span>Проблемы связей: <strong>{invalidDescriptions.join(', ')}</strong> — сохранение заблокировано</span>
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={readOnly ? undefined : handleNodesChange}
                onEdgesChange={readOnly ? undefined : onEdgesChange}
                onNodeClick={onNodeClick}
                onConnect={readOnly ? undefined : onConnect}
                onReconnectStart={readOnly ? undefined : onReconnectStart}
                onReconnect={readOnly ? undefined : onReconnect}
                onReconnectEnd={readOnly ? undefined : onReconnectEnd}
                onEdgeDoubleClick={readOnly ? undefined : onEdgeDoubleClick}
                edgesReconnectable={!readOnly}
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                elementsSelectable={!readOnly}
                onPaneClick={onPaneClick}
                onPaneContextMenu={readOnly ? undefined : onPaneContextMenu}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                isValidConnection={(c) => c.source !== c.target}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={24} size={1} color="#E8ECF1" />
                {!compact && <Controls showInteractive={false} />}

                {/* Toolbar panel */}
                {!readOnly && (
                    <Panel position="top-right" className={styles.graphToolbar}>
                        <button className={styles.toolbarBtn} onClick={() => onAutoLayout('BT')} title="Авто-раскладка (вертикальная)">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5.5" y="0.5" width="5" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><rect x="0.5" y="12.5" width="5" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><rect x="10.5" y="12.5" width="5" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><path d="M8 3.5V9M8 9l-5 3.5M8 9l5 3.5" stroke="currentColor" strokeWidth="1.1" /></svg>
                            Авто
                        </button>
                        <button className={styles.toolbarBtn} onClick={() => onAutoLayout('LR')} title="Авто-раскладка (горизонтальная)">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="0.5" y="5.5" width="3" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><rect x="12.5" y="0.5" width="3" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><rect x="12.5" y="10.5" width="3" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.1" /><path d="M3.5 8H9M9 8l3.5-5M9 8l3.5 5" stroke="currentColor" strokeWidth="1.1" /></svg>
                        </button>
                        <div className={styles.toolbarDivider} />
                        <button
                            className={`${styles.toolbarBtn} ${styles.toolbarBtnSave} ${isDirty ? styles.toolbarBtnDirty : ''} ${hasInvalid && isDirty ? styles.toolbarBtnBlocked : ''}`}
                            onClick={handleSaveGraph}
                            disabled={!isDirty || isSaving || hasInvalid}
                            title={hasInvalid ? 'Есть проблемы со связями' : isDirty ? 'Сохранить изменения' : 'Нет изменений'}
                        >
                            {isSaving ? (
                                <svg className={styles.spinnerIcon} width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" /></svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.333 2H4L2 4v9.333C2 13.7 2.3 14 2.667 14h10.666c.368 0 .667-.3.667-.667V2.667C14 2.3 13.7 2 13.333 2z" stroke="currentColor" strokeWidth="1.2" /><path d="M5.333 2v4h5.334V2M4.667 14V9.333h6.666V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                            )}
                            Сохранить
                        </button>
                    </Panel>
                )}
            </ReactFlow>

            {!readOnly && menu && (
                <div ref={menuRef} className={styles.contextMenu} style={{ top: menu.y, left: menu.x }}>
                    <button className={styles.contextMenuItem} onClick={openAddDialog}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        Добавить предмет
                    </button>
                </div>
            )}

            {!readOnly && dialog && (
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
        </GraphEditContext.Provider>
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
    const [graphStore, setGraphStore] = useState(initialGraphStore);
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
        if (selectedYears.length > 0) {
            const yearId = selectedYears[0].id;
            setGraphStore((prev) => ({
                ...prev,
                [yearId]: {
                    ...getGraphDataForYear(prev, yearId),
                    details: { ...getGraphDataForYear(prev, yearId).details, [updated.id]: updated },
                },
            }));
        }
        setSelectedCourse(updated);
    }, [selectedYears]);

    const isCompare = selectedYears.length === 2;

    const compareDiff = useMemo(() => {
        if (!isCompare) return null;
        const dataA = getGraphDataForYear(graphStore, selectedYears[0].id);
        const dataB = getGraphDataForYear(graphStore, selectedYears[1].id);
        return computeDiff(dataA.nodes, dataA.edges, dataB.nodes, dataB.edges);
    }, [isCompare, graphStore, selectedYears]);

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
                            {isCompare && (
                                <>
                                    <div className={styles.legendDivider} />
                                    <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#16A34A', boxShadow: '0 0 6px rgba(22,163,74,0.4)' }} /><span>Уникальное</span></div>
                                    <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#94A3B8', opacity: 0.5 }} /><span>Общее</span></div>
                                </>
                            )}
                        </div>
                    </div>

                    <GraphPanel
                        key={selectedYears[0].id}
                        label={selectedYears[0].label}
                        labelColor={selectedProgram.color}
                        initNodes={getGraphDataForYear(graphStore, selectedYears[0].id).nodes}
                        initEdges={getGraphDataForYear(graphStore, selectedYears[0].id).edges}
                        details={getGraphDataForYear(graphStore, selectedYears[0].id).details}
                        onSelectCourse={setSelectedCourse}
                        onDetailsChange={(d) => setGraphStore((prev) => ({ ...prev, [selectedYears[0].id]: { ...getGraphDataForYear(prev, selectedYears[0].id), details: d } }))}
                        compact={isCompare}
                        readOnly={isCompare}
                        diff={compareDiff?.diffA}
                    />

                    {isCompare && (
                        <>
                            <div className={styles.compareDivider}>
                                <span className={styles.compareDividerLabel}>VS</span>
                            </div>
                            <GraphPanel
                                key={selectedYears[1].id}
                                label={selectedYears[1].label}
                                labelColor="#D97706"
                                initNodes={getGraphDataForYear(graphStore, selectedYears[1].id).nodes}
                                initEdges={getGraphDataForYear(graphStore, selectedYears[1].id).edges}
                                details={getGraphDataForYear(graphStore, selectedYears[1].id).details}
                                onSelectCourse={setSelectedCourse}
                                onDetailsChange={(d) => setGraphStore((prev) => ({ ...prev, [selectedYears[1].id]: { ...getGraphDataForYear(prev, selectedYears[1].id), details: d } }))}
                                compact
                                readOnly
                                diff={compareDiff?.diffB}
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
