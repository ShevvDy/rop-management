import React, { useState, useCallback, useMemo, useRef, useEffect, createContext, useContext } from 'react';
import { useToast } from '../../components/Toast';
import { getPrograms, getProgram, createProgram as apiCreateProgram, deleteProgram as apiDeleteProgram } from '../../api/programs';
import { createCohort as apiCreateCohort, getCohortGraph, updateCohortGraph, getCohortStudents, deleteCohort as apiDeleteCohort } from '../../api/cohorts';
import { updateCourse } from '../../api/courses';
import { getFaculties, createFaculty as apiCreateFaculty, deleteFaculty as apiDeleteFaculty } from '../../api/faculties';
import { getTags, getUsers } from '../../api/users';
import type { ProgramResponse, ProgramWithRelations, FacultyResponse, CohortInProgram, EducationPlanGraph, StudentBase, Specialization, TagBase } from '../../api/types';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getLayoutedElements } from '../../utils/graphLayout';
import CourseNode, { type CourseNodeData } from '../../components/CourseNode';
import CourseDetailPanel, { type CourseDetail } from '../../components/CourseDetailPanel';
import styles from './DashboardPage.module.css';

/* ═══════════════════════════════════════════
   Validation: check graph connectivity
   - ВКР node: must have at least one incoming edge
   - All other nodes: must have at least one outgoing edge (leading towards ВКР)
   ═══════════════════════════════════════════ */
const VKR_NODE_ID = 'vkr';

const isVkrNode = (n: Node): boolean =>
    n.id === VKR_NODE_ID || (n.data as CourseNodeData)?.code === 'ВКР';

/**
 * Проверяет, существует ли путь from → ... → to длиной ≥ 2 в графе.
 * Опционально игнорирует одно ребро (нужно при добавлении нового — само добавляемое не учитываем).
 */
const hasIndirectPath = (
    edges: Edge[],
    from: string,
    to: string,
    ignoreEdge?: { source: string; target: string },
): boolean => {
    const adj = new Map<string, string[]>();
    edges.forEach((e) => {
        if (ignoreEdge && e.source === ignoreEdge.source && e.target === ignoreEdge.target) return;
        if (!adj.has(e.source)) adj.set(e.source, []);
        adj.get(e.source)!.push(e.target);
    });
    const visited = new Set<string>();
    const stack: { node: string; depth: number }[] = [{ node: from, depth: 0 }];
    while (stack.length) {
        const { node, depth } = stack.pop()!;
        if (visited.has(node)) continue;
        visited.add(node);
        if (node === to && depth >= 2) return true;
        const next = adj.get(node) || [];
        for (const n of next) stack.push({ node: n, depth: depth + 1 });
    }
    return false;
};

const findInvalidNodes = (nodes: Node[], edges: Edge[]): string[] => {
    if (nodes.length <= 1) return [];
    const sources = new Set<string>();
    const targets = new Set<string>();
    edges.forEach((e) => { sources.add(e.source); targets.add(e.target); });

    return nodes.filter((n) => {
        if (isVkrNode(n)) {
            // ��КР must have at least one incoming edge
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
    const isVkr = props.id === VKR_NODE_ID || props.data?.code === 'ВКР';

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
                    Нет связей
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
   UI interfaces & API mapping helpers
   ═══════════════════════════════════════════ */

interface Faculty {
    id: string;
    facultyId: number;
    name: string;
    shortName: string;
    programsCount: number;
    color: string;
}

interface Program {
    id: string;
    programId: number;
    name: string;
    code: string;
    degree: string;
    faculty: string;
    facultyId: number;
    color: string;
    yearsCount: number;
    coursesCount: number;
    durationYears: number;
}

interface YearPlan {
    id: string;
    cohortId: number;
    year: number;
    label: string;
    status: 'active' | 'draft' | 'archived';
    coursesCount: number;
    studentsCount: number;
}

const LEVEL_LABELS: Record<string, string> = {
    bachelor: 'Бакалавриат',
    master: 'Магистратура',
    phd: 'Аспирантура',
};

const FACULTY_COLORS = ['#0891B2', '#7C3AED', '#059669', '#D97706', '#DC2626', '#135BEC', '#8B5CF6', '#2563EB'];

const mapFacultyToUI = (f: FacultyResponse, index: number): Faculty => ({
    id: String(f.faculty_id),
    facultyId: f.faculty_id,
    name: f.name,
    shortName: f.short_name || '',
    programsCount: f.programs?.length ?? 0,
    color: FACULTY_COLORS[index % FACULTY_COLORS.length],
});

const PROGRAM_COLORS = ['#135BEC', '#8B5CF6', '#059669', '#D97706', '#DC2626', '#0891B2', '#7C3AED', '#2563EB'];

const mapProgramToUI = (p: ProgramResponse, index: number, cohorts?: CohortInProgram[]): Program => ({
    id: String(p.program_id),
    programId: p.program_id,
    name: p.name,
    code: '',
    degree: LEVEL_LABELS[p.level] || p.level,
    faculty: p.faculty?.name || '',
    facultyId: p.faculty?.faculty_id ?? 0,
    color: PROGRAM_COLORS[index % PROGRAM_COLORS.length],
    yearsCount: cohorts?.length ?? 0,
    coursesCount: 0,
    durationYears: p.duration_years,
});

const mapCohortToUI = (c: CohortInProgram): YearPlan => ({
    id: `cohort-${c.cohort_id}`,
    cohortId: c.cohort_id,
    year: c.cohort_year,
    label: `${c.cohort_year}/${c.cohort_year + 1}`,
    status: 'active',
    coursesCount: 0,
    studentsCount: 0,
});

/* ── Convert API graph → React Flow nodes/edges/details ── */
const apiGraphToFlowData = (graph: EducationPlanGraph): YearGraphData => {
    const nodes: Node<CourseNodeData>[] = graph.nodes.map((c) => ({
        id: String(c.course_id),
        type: 'courseNode',
        position: { x: 0, y: 0 },
        data: {
            code: c.code,
            name: c.name,
            credits: c.credits,
            type: c.is_elective ? 'elective' as const : 'required' as const,
            semester: `${c.semester_number} семестр`,
            elective_students_ids: c.elective_students_ids,
        },
    }));

    const edges: Edge[] = graph.edges.map((e) => ({
        id: `e-${e.source}-${e.target}`,
        source: String(e.source),
        target: String(e.target),
        type: 'deletable',
        style: { stroke: '#CBD5E1', strokeWidth: 2 },
    }));

    const details: Record<string, CourseDetail> = {};
    graph.nodes.forEach((c) => {
        const id = String(c.course_id);
        details[id] = {
            id,
            code: c.code,
            name: c.name,
            semester: `${c.semester_number} семестр`,
            type: c.is_elective ? 'elective' : 'required',
            credits: c.credits,
            summary: '',
            students: { avatars: [], total: c.elective_students_ids?.length ?? 0 },
            teachers: [],
            materials: [],
            elective_students_ids: c.elective_students_ids,
            teachers_ids: c.teachers_ids,
            specialization: c.specialization_id ? { specialization_id: c.specialization_id, name: c.specialization_name || '' } : null,
            tags: c.tags_data || [],
        };
    });

    /* Ensure a ВКР (is_last) node always exists */
    const hasVkr = graph.nodes.some((c) => c.is_last);
    if (!hasVkr) {
        nodes.push({ id: VKR_NODE_ID, type: 'courseNode', position: { x: 0, y: 0 }, data: { code: 'ВКР', name: 'Выпускная квалификационная работа', credits: 12, type: 'required', semester: '8 семестр' } });
        details[VKR_NODE_ID] = { id: VKR_NODE_ID, code: 'ВКР', name: 'Выпускная квалификационная работа', semester: '8 семестр', type: 'required', credits: 12, summary: 'Итоговая квалификационная работа. Самостоятельное исследование или проект под руководством научного руководителя.', students: { avatars: [], total: 0 }, teachers: [], materials: [] };
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    return { nodes: layoutedNodes, edges: layoutedEdges, details };
};

/* ── Convert React Flow nodes/edges → API payload ── */
const flowDataToApiPayload = (nodes: Node<CourseNodeData>[], edges: Edge[]) => {
    const apiNodes = nodes.map((n) => {
        const courseId = /^\d+$/.test(n.id) ? Number(n.id) : null;
        const semMatch = n.data.semester?.match(/(\d+)/);
        const semesterNumber = semMatch ? Number(semMatch[1]) : 1;
        return {
            course_id: courseId,
            name: n.data.name,
            code: n.data.code,
            semester_number: semesterNumber,
            credits: n.data.credits,
            form: 'offline',
            is_elective: n.data.type === 'elective',
            is_last: isVkrNode(n),
            elective_students_ids: n.data.elective_students_ids,
        };
    });

    /* For edges: numeric IDs refer to existing courses, non-numeric IDs
       (e.g. "course-1712345678") are new nodes — resolve to their code */
    const nodeCodeMap = new Map<string, string>();
    nodes.forEach((n) => { if (n.data?.code) nodeCodeMap.set(n.id, n.data.code); });

    const resolveEdgeRef = (id: string): number | string => {
        if (/^\d+$/.test(id)) return Number(id);
        return nodeCodeMap.get(id) || id;
    };

    const apiEdges = edges.map((e) => ({
        source: resolveEdgeRef(e.source),
        target: resolveEdgeRef(e.target),
    }));

    return { nodes: apiNodes, edges: apiEdges };
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

/* Pre-layout initial demo data */
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
    onGraphSaved?: (data: YearGraphData) => void;
    cohortId?: number;
    compact?: boolean;
    readOnly?: boolean;
    diff?: DiffInfo | null;
    durationYears?: number;
}

const GraphPanelInner: React.FC<GraphPanelProps> = ({ label, labelColor, initNodes, initEdges, details, onSelectCourse, onDetailsChange, onGraphSaved, cohortId, compact, readOnly = false, diff = null, durationYears }) => {
    const toast = useToast();
    const semestersCount = Math.max(1, (durationYears ?? 4) * 2);
    const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

    /* Sync node data when parent updates (e.g. after editing in CourseDetailPanel) */
    useEffect(() => {
        setNodes((prev) => prev.map((n) => {
            const updated = initNodes.find((init) => init.id === n.id);
            if (!updated) return n;
            const dataChanged = n.data.name !== updated.data.name
                || n.data.code !== updated.data.code
                || n.data.credits !== updated.data.credits
                || n.data.type !== updated.data.type
                || n.data.semester !== updated.data.semester;
            return dataChanged ? { ...n, data: updated.data } : n;
        }));
    }, [initNodes, setNodes]);

    const { screenToFlowPosition, fitView } = useReactFlow();
    const [menu, setMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
    const [dialog, setDialog] = useState(false);
    const [pendingPos, setPendingPos] = useState({ x: 0, y: 0 });
    const [form, setForm] = useState({ code: '', name: '', credits: 3, type: 'required' as CourseNodeData['type'], semester: '1' });
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
            if (n && isVkrNode(n)) return `${name} (нет входящих связей)`;
            return `${name} (нет исходящих связей)`;
        }), [invalidIds, nodes]);

    /* ── Delete node handler ── */
    const handleDeleteNode = useCallback((nodeId: string) => {
        const nodeToDelete = nodes.find((n) => n.id === nodeId);
        if (nodeId === VKR_NODE_ID || nodeToDelete?.data?.code === 'ВКР') return;
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        const newDetails = { ...details };
        delete newDetails[nodeId];
        onDetailsChange(newDetails);
        onSelectCourse(null);
        markDirty();
    }, [nodes, setNodes, setEdges, details, onDetailsChange, onSelectCourse, markDirty]);

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
        if (!c.source || !c.target || c.source === c.target) return;
        if (hasIndirectPath(edges, c.source, c.target)) {
            toast.warning('Уже есть транзитивная связь между этими дисциплинами');
            return;
        }
        if (hasIndirectPath(edges, c.target, c.source)) {
            toast.warning('Связь создаст цикл в графе');
            return;
        }
        setEdges((eds) => addEdge({ ...c, type: 'deletable', style: edgeStyle }, eds));
        markDirty();
    }, [edges, setEdges, markDirty]);

    /* ── Edge reconnect (drag handle to detach/reattach) ── */
    const edgeReconnectSuccessful = useRef(true);
    const onReconnectStart = useCallback(() => { edgeReconnectSuccessful.current = false; }, []);
    const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeReconnectSuccessful.current = true;
        if (!newConnection.source || !newConnection.target || newConnection.source === newConnection.target) return;
        /* Игнорируем старое ребро при проверке — иначе сами себе помешаем переподключить */
        const ignore = { source: oldEdge.source, target: oldEdge.target };
        if (hasIndirectPath(edges, newConnection.source, newConnection.target, ignore)) {
            toast.warning('Уже есть транзитивная связь между этими дисциплинами');
            return;
        }
        if (hasIndirectPath(edges, newConnection.target, newConnection.source, ignore)) {
            toast.warning('Связь создаст цикл в графе');
            return;
        }
        setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
        markDirty();
    }, [edges, setEdges, markDirty]);
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
        setForm({ code: '', name: '', credits: 3, type: 'required', semester: '1' });
        setMenu(null);
        setDialog(true);
    }, [menu]);

    const handleAddNode = useCallback(() => {
        if (!form.name.trim() || !form.code.trim()) return;
        const id = `course-${Date.now()}`;
        const semesterLabel = `${form.semester} семестр`;
        const data: CourseNodeData = { code: form.code.trim(), name: form.name.trim(), credits: form.credits, type: form.type, semester: semesterLabel };
        const newNode: Node<CourseNodeData> = { id, type: 'courseNode', position: pendingPos, data };
        const { nodes: ln, edges: le } = getLayoutedElements([...nodes, newNode], edges);
        setNodes([...ln]);
        setEdges([...le]);
        onDetailsChange({ ...details, [id]: { id, code: data.code, name: data.name, semester: data.semester, type: data.type, credits: data.credits, summary: '', students: { avatars: [], total: 0 }, teachers: [], materials: [] } });
        setDialog(false);
        markDirty();
        requestAnimationFrame(() => fitView({ padding: 0.3 }));
    }, [form, pendingPos, nodes, edges, setNodes, setEdges, details, onDetailsChange, markDirty, fitView]);

    /* ── Dagre auto-layout ── */
    const onAutoLayout = useCallback((direction: 'TB' | 'LR' = 'TB') => {
        const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges, direction);
        setNodes([...ln]);
        setEdges([...le]);
        /* Горизонтальный вид — чисто визуал, dirty-флаг не выставляем */
        if (direction === 'TB') markDirty();
        requestAnimationFrame(() => fitView({ padding: 0.3 }));
    }, [nodes, edges, setNodes, setEdges, markDirty, fitView]);

    /* ── Save handler ── */
    const handleSaveGraph = useCallback(async () => {
        if (!cohortId) return;
        /* Все новые ноды (без числового course_id) обязаны иметь непустой код,
           иначе бэкенд не сможет разрезолвить ссылки в рёбрах. */
        const newNodesWithoutCode = nodes.filter((n) => !/^\d+$/.test(n.id) && !n.data?.code?.trim());
        if (newNodesWithoutCode.length > 0) {
            const names = newNodesWithoutCode.map((n) => n.data?.name || n.id).join(', ');
            toast.error(`У новых дисциплин не указан код: ${names}. Заполните код перед сохранением.`);
            return;
        }
        setIsSaving(true);
        try {
            const payload = flowDataToApiPayload(nodes, edges);
            const result = await updateCohortGraph(cohortId, payload);
            const newData = apiGraphToFlowData(result);
            setNodes(newData.nodes);
            setEdges(newData.edges);
            onDetailsChange(newData.details);
            onGraphSaved?.(newData);
            setIsDirty(false);
            toast.success('Граф успешно сохранён');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Ошибка сохранения графа';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    }, [nodes, edges, cohortId, setNodes, setEdges, onDetailsChange, onGraphSaved]);

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
                isValidConnection={(c) => {
                    if (!c.source || !c.target || c.source === c.target) return false;
                    /* Запрещаем создание прямой связи source→target, если уже есть путь
                       source → ... → target длиной ≥ 2 (избегаем избыточных рёбер). */
                    if (hasIndirectPath(edges, c.source, c.target)) return false;
                    /* И симметрично — нельзя создавать обратное ребро, иначе получится цикл. */
                    if (hasIndirectPath(edges, c.target, c.source)) return false;
                    return true;
                }}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={24} size={1} color="#E8ECF1" />
                {!compact && <Controls showInteractive={false} />}

                {/* Toolbar panel */}
                {!readOnly && (
                    <Panel position="top-right" className={styles.graphToolbar}>
                        <button className={styles.toolbarBtn} onClick={() => onAutoLayout('TB')} title="Авто-раскладка (вертикальная)">
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
                            <label className={styles.dialogLabel}>КОД КУРСА *</label>
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
                                    <input className={styles.dialogInput} type="number" min={1} max={10} value={form.credits === 0 ? '' : form.credits} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, credits: v === '' ? 0 : Number(v) })); }} />
                                </div>
                            </div>
                            <label className={styles.dialogLabel}>СЕМЕСТР</label>
                            <select className={styles.dialogSelect} value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}>
                                {Array.from({ length: semestersCount }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={String(n)}>{n} семестр</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.dialogFooter}>
                            <button className={styles.dialogBtnCancel} onClick={() => setDialog(false)}>Отмена</button>
                            <button className={styles.dialogBtnSubmit} onClick={handleAddNode} disabled={!form.name.trim() || !form.code.trim()}>Добавить</button>
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
interface CreateFacultyModalProps { onClose: () => void; onCreate: (f: Faculty) => void; existingCount: number; }

const CreateFacultyModal: React.FC<CreateFacultyModalProps> = ({ onClose, onCreate, existingCount }) => {
    const toast = useToast();
    const [name, setName] = useState('');
    const [shortName, setShortName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            const resp = await apiCreateFaculty({
                name: name.trim(),
                short_name: shortName.trim() || null,
            });
            const ui = mapFacultyToUI(resp, existingCount);
            onCreate(ui);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Ошибка создания факультета';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.dialogOverlay} onClick={onClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.dialogHeader}>
                    <span>Новый факультет</span>
                    <button className={styles.dialogClose} onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                </div>
                <div className={styles.dialogBody}>
                    <label className={styles.dialogLabel}>НАЗВАНИЕ ФАКУЛЬТЕТА *</label>
                    <input className={styles.dialogInput} placeholder="Факультет информационных технологий" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                    <label className={styles.dialogLabel}>СОКРАЩЕНИЕ</label>
                    <input className={styles.dialogInput} placeholder="ФИТ" value={shortName} onChange={(e) => setShortName(e.target.value)} />
                </div>
                <div className={styles.dialogFooter}>
                    <button className={styles.dialogBtnCancel} onClick={onClose}>Отмена</button>
                    <button className={styles.dialogBtnSubmit} disabled={!name.trim() || submitting} onClick={handleSubmit}>
                        {submitting ? 'Создание...' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface CreateProgramModalProps { onClose: () => void; onCreate: (p: Program) => void; existingCount: number; facultyId: number; }

const DEGREE_TO_LEVEL: Record<string, 'bachelor' | 'master' | 'phd'> = {
    'Бакалавриат': 'bachelor',
    'Магистратура': 'master',
    'Аспирантура': 'phd',
};

const DEGREE_TO_DURATION: Record<string, number> = {
    'Бакалавриат': 4,
    'Магистратура': 2,
    'Аспирантура': 3,
};

const CreateProgramModal: React.FC<CreateProgramModalProps> = ({ onClose, onCreate, existingCount, facultyId }) => {
    const toast = useToast();
    const [name, setName] = useState('');
    const [degree, setDegree] = useState('Бакалавриат');
    const [submitting, setSubmitting] = useState(false);
    const colors = PROGRAM_COLORS;
    const [color, setColor] = useState(colors[0]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            const resp = await apiCreateProgram({
                name: name.trim(),
                accreditation_year: new Date().getFullYear(),
                level: DEGREE_TO_LEVEL[degree] || 'bachelor',
                form: 'offline',
                lang: 'ru',
                duration_years: DEGREE_TO_DURATION[degree] || 4,
                faculty_id: facultyId,
            });
            const ui = mapProgramToUI(resp, existingCount);
            ui.color = color;
            onCreate(ui);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Ошибка создания программы';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

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
                            <label className={styles.dialogLabel}>УРОВЕНЬ</label>
                            <select className={styles.dialogSelect} value={degree} onChange={(e) => setDegree(e.target.value)}>
                                <option>Бакалавриат</option>
                                <option>Магистратура</option>
                                <option>Аспирантура</option>
                            </select>
                        </div>
                    </div>
                    <label className={styles.dialogLabel}>ЦВЕТ</label>
                    <div className={styles.colorPicker}>
                        {colors.map((c) => (
                            <button key={c} className={`${styles.colorSwatch} ${color === c ? styles.active : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
                        ))}
                    </div>
                </div>
                <div className={styles.dialogFooter}>
                    <button className={styles.dialogBtnCancel} onClick={onClose}>Отмена</button>
                    <button className={styles.dialogBtnSubmit} disabled={!name.trim() || submitting} onClick={handleSubmit}>
                        {submitting ? 'Создание...' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface CreateYearModalProps { onClose: () => void; onCreate: (y: YearPlan) => void; existingYears: number[]; programId: number; }

const CreateYearModal: React.FC<CreateYearModalProps> = ({ onClose, onCreate, existingYears, programId }) => {
    const toast = useToast();
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [submitting, setSubmitting] = useState(false);
    const isDuplicate = existingYears.includes(year);
    const isValid = year >= 2000 && year <= 2100 && !isDuplicate;

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    const handleSubmit = async () => {
        if (!isValid) return;
        setSubmitting(true);
        try {
            const resp = await apiCreateCohort({
                cohort_year: year,
                program_id: programId,
            });
            onCreate({
                id: `cohort-${resp.cohort_id}`,
                cohortId: resp.cohort_id,
                year: resp.cohort_year,
                label: `${resp.cohort_year}/${resp.cohort_year + 1}`,
                status: 'active',
                coursesCount: 0,
                studentsCount: 0,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Ошибка создания когорты';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

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
                    <input
                        type="number"
                        className={styles.dialogSelect}
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        min={2000}
                        max={2100}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter' && isValid) handleSubmit(); }}
                    />
                    {isDuplicate && (
                        <p className={styles.dialogHint} style={{ color: '#EF4444' }}>Когорта {year}/{year + 1} уже существует</p>
                    )}
                    {!isDuplicate && isValid && (
                        <p className={styles.dialogHint}>Будет создан пустой учебный план для набора {year}/{year + 1} года.</p>
                    )}
                </div>
                <div className={styles.dialogFooter}>
                    <button className={styles.dialogBtnCancel} onClick={onClose}>Отмена</button>
                    <button className={styles.dialogBtnSubmit} disabled={!isValid || submitting} onClick={handleSubmit}>
                        {submitting ? 'Создание...' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════
   Main Dashboard Page
   ═══════════════════════════════════════════ */
type View = 'faculties' | 'programs' | 'years' | 'graph';

const DashboardPage: React.FC = () => {
    const toast = useToast();
    const [view, setView] = useState<View>('faculties');
    const [allFaculties, setAllFaculties] = useState<Faculty[]>([]);
    const [allPrograms, setAllPrograms] = useState<Record<string, Program[]>>({});
    const [allYears, setAllYears] = useState<Record<string, YearPlan[]>>({});
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [selectedYears, setSelectedYears] = useState<YearPlan[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
    const [graphStore, setGraphStore] = useState<Record<string, YearGraphData>>(initialGraphStore);
    const [loadingGraph, setLoadingGraph] = useState(false);
    const [showCreateFaculty, setShowCreateFaculty] = useState(false);
    const [showCreateProgram, setShowCreateProgram] = useState(false);
    const [showCreateYear, setShowCreateYear] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [loadingYears, setLoadingYears] = useState(false);
    const [cohortStudents, setCohortStudents] = useState<StudentBase[]>([]);
    const [cohortSpecializations, setCohortSpecializations] = useState<Specialization[]>([]);
    const [allTags, setAllTags] = useState<TagBase[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<{ title: string; message: string; onConfirm: () => Promise<void> } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    /* ── Load faculties from API ── */
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getFaculties()
            .then((data) => {
                if (cancelled) return;
                setAllFaculties(data.map((f, i) => mapFacultyToUI(f, i)));
            })
            .catch(() => {
                if (!cancelled) toast.error('Не удалось загрузить факультеты');
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    /* ── Select faculty → load programs ── */
    const handleSelectFaculty = (f: Faculty) => {
        setSelectedFaculty(f);
        setSelectedProgram(null);
        setSelectedYears([]);
        setView('programs');

        if (allPrograms[f.id]) return;

        setLoadingPrograms(true);
        getPrograms()
            .then((data) => {
                const filtered = data.filter((p) => p.faculty?.faculty_id === f.facultyId);
                const programs = filtered.map((p, i) => mapProgramToUI(p, i));
                setAllPrograms((prev) => ({ ...prev, [f.id]: programs }));
            })
            .catch(() => toast.error('Не удалось загрузить программы'))
            .finally(() => setLoadingPrograms(false));
    };

    /* ── Load cohorts when selecting a program ── */
    const handleSelectProgram = (p: Program) => {
        setSelectedProgram(p);
        setSelectedYears([]);
        setView('years');

        if (allYears[p.id]) return;

        setLoadingYears(true);
        getProgram(p.programId)
            .then((data: ProgramWithRelations) => {
                const cohorts = (data.cohorts || []).map(mapCohortToUI);
                cohorts.sort((a, b) => b.year - a.year);
                setAllYears((prev) => ({ ...prev, [p.id]: cohorts }));
                if (selectedFaculty) {
                    setAllPrograms((prev) => ({
                        ...prev,
                        [selectedFaculty.id]: (prev[selectedFaculty.id] || []).map((prog) =>
                            prog.id === p.id ? { ...prog, yearsCount: cohorts.length } : prog,
                        ),
                    }));
                }
            })
            .catch(() => toast.error('Не удалось загрузить годы набора'))
            .finally(() => setLoadingYears(false));
    };

    const handleToggleYear = (yp: YearPlan) => {
        setSelectedYears((prev) => {
            const exists = prev.find((y) => y.id === yp.id);
            if (exists) return prev.filter((y) => y.id !== yp.id);
            if (prev.length >= 2) return [prev[1], yp];
            return [...prev, yp];
        });
    };

    const handleOpenGraph = async () => {
        if (selectedYears.length === 0) return;
        setLoadingGraph(true);
        setView('graph');
        try {
            const toLoad = selectedYears.filter((y) => !graphStore[y.id]);
            const [graphResults, tagsData, usersData] = await Promise.all([
                Promise.all(
                    toLoad.map(async (y) => {
                        const graph = await getCohortGraph(y.cohortId);
                        return { yearId: y.id, data: apiGraphToFlowData(graph) };
                    }),
                ),
                getTags().catch(() => [] as TagBase[]),
                getUsers().catch(() => []),
            ]);

            /* Populate teachers from users data */
            const usersMap = new Map(usersData.map(u => [u.user_id, u]));
            graphResults.forEach(({ data }) => {
                Object.values(data.details).forEach(detail => {
                    if (detail.teachers_ids && detail.teachers_ids.length > 0) {
                        detail.teachers = detail.teachers_ids.map(uid => {
                            const u = usersMap.get(uid);
                            if (!u) return null;
                            const name = [u.surname, u.name, u.patronymic].filter(Boolean).join(' ');
                            return {
                                name,
                                role: 'Преподаватель',
                                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E0E7FF&color=135BEC&size=80`,
                                user_id: uid,
                            };
                        }).filter((t): t is NonNullable<typeof t> => t != null);
                    }
                });
            });

            /* Load students for the primary cohort */
            const primaryCohortId = selectedYears[0].cohortId;
            try {
                const studentsResp = await getCohortStudents(primaryCohortId);
                setCohortStudents(studentsResp.students ?? []);
                setCohortSpecializations(studentsResp.specializations ?? []);
            } catch {
                setCohortStudents([]);
                setCohortSpecializations([]);
            }

            setAllTags(tagsData);

            if (graphResults.length > 0) {
                setGraphStore((prev) => {
                    const next = { ...prev };
                    graphResults.forEach(({ yearId, data }) => { next[yearId] = data; });
                    return next;
                });
            }
        } catch {
            toast.error('Не удалось загрузить граф учебного плана');
        } finally {
            setLoadingGraph(false);
        }
    };

    const handleBack = () => {
        if (view === 'graph') { setView('years'); setSelectedCourse(null); }
        else if (view === 'years') { setView('programs'); setSelectedProgram(null); setSelectedYears([]); }
        else if (view === 'programs') { setView('faculties'); setSelectedFaculty(null); setSelectedProgram(null); setSelectedYears([]); }
    };

    /* ── Delete handlers ── */
    const handleDeleteFaculty = (e: React.MouseEvent, faculty: Faculty) => {
        e.stopPropagation();
        setDeleteConfirm({
            title: 'Удалить факультет',
            message: `Факультет «${faculty.name}» и все связанные программы, когорты и учебные планы будут удалены безвозвратно.`,
            onConfirm: async () => {
                await apiDeleteFaculty(faculty.facultyId);
                setAllFaculties(prev => prev.filter(f => f.id !== faculty.id));
                toast.success('Факультет удалён');
            },
        });
    };

    const handleDeleteProgram = (e: React.MouseEvent, prog: Program) => {
        e.stopPropagation();
        setDeleteConfirm({
            title: 'Удалить программу',
            message: `Программа «${prog.name}» и все связанные когорты и учебные планы будут удалены безвозвратно.`,
            onConfirm: async () => {
                await apiDeleteProgram(prog.programId);
                if (selectedFaculty) {
                    setAllPrograms(prev => ({
                        ...prev,
                        [selectedFaculty.id]: (prev[selectedFaculty.id] || []).filter(p => p.id !== prog.id),
                    }));
                    setAllFaculties(prev => prev.map(f => f.id === selectedFaculty.id ? { ...f, programsCount: f.programsCount - 1 } : f));
                }
                toast.success('Программа удалена');
            },
        });
    };

    const handleDeleteYear = (e: React.MouseEvent, yp: YearPlan) => {
        e.stopPropagation();
        setDeleteConfirm({
            title: 'Удалить когорту',
            message: `Когорта ${yp.label} и все студенты, учебный план будут удалены безвозвратно.`,
            onConfirm: async () => {
                await apiDeleteCohort(yp.cohortId);
                if (selectedProgram) {
                    setAllYears(prev => ({
                        ...prev,
                        [selectedProgram.id]: (prev[selectedProgram.id] || []).filter(y => y.id !== yp.id),
                    }));
                    if (selectedFaculty) {
                        setAllPrograms(prev => ({
                            ...prev,
                            [selectedFaculty.id]: (prev[selectedFaculty.id] || []).map(p =>
                                p.id === selectedProgram.id ? { ...p, yearsCount: p.yearsCount - 1 } : p
                            ),
                        }));
                    }
                }
                setSelectedYears(prev => prev.filter(y => y.id !== yp.id));
                toast.success('Когорта удалена');
            },
        });
    };

    const executeDelete = async () => {
        if (!deleteConfirm) return;
        setDeleteLoading(true);
        try {
            await deleteConfirm.onConfirm();
        } catch {
            toast.error('Не удалось выполнить удаление');
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(null);
        }
    };

    const applyCourseUpdate = useCallback((updated: CourseDetail) => {
        if (selectedYears.length > 0) {
            const yearId = selectedYears[0].id;
            setGraphStore((prev) => {
                const current = getGraphDataForYear(prev, yearId);
                const updatedNodes = current.nodes.map((n) => {
                    if (n.id !== updated.id) return n;
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            code: updated.code,
                            name: updated.name,
                            credits: updated.credits,
                            type: updated.type,
                            semester: updated.semester,
                        },
                    };
                });
                return {
                    ...prev,
                    [yearId]: {
                        ...current,
                        nodes: updatedNodes,
                        details: { ...current.details, [updated.id]: updated },
                    },
                };
            });
        }
        setSelectedCourse(updated);
    }, [selectedYears]);

    const handleSave = useCallback(async (updated: CourseDetail) => {
        /* Локально добавленные ноды (id вида "course-12345") пока не имеют backend course_id —
           для них сохраняем только в локальном стейте, в рамках общего сохранения графа. */
        const courseId = /^\d+$/.test(updated.id) ? Number(updated.id) : null;
        if (courseId === null) {
            applyCourseUpdate(updated);
            return;
        }
        const semMatch = updated.semester?.match(/(\d+)/);
        const semesterNumber = semMatch ? Number(semMatch[1]) : 1;
        try {
            await updateCourse(courseId, {
                name: updated.name,
                code: updated.code,
                semester_number: semesterNumber,
                credits: updated.credits,
                is_elective: updated.type === 'elective',
                elective_students_ids: updated.elective_students_ids,
                tags_ids: updated.tags?.map(t => t.tag_id),
                specialization_id: updated.specialization?.specialization_id ?? null,
                teachers_ids: updated.teachers_ids,
            });
            applyCourseUpdate(updated);
            toast.success('Дисциплина обновлена');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Ошибка сохранения дисциплины';
            toast.error(msg);
        }
    }, [applyCourseUpdate]);

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
                <button className={`${styles.breadcrumbItem} ${view === 'faculties' ? styles.active : ''}`} onClick={() => { setView('faculties'); setSelectedFaculty(null); setSelectedProgram(null); setSelectedYears([]); setSelectedCourse(null); }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Факультеты
                </button>
                {selectedFaculty && (
                    <>
                        <svg className={styles.breadcrumbSep} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                        <button className={`${styles.breadcrumbItem} ${view === 'programs' ? styles.active : ''}`} onClick={() => { setView('programs'); setSelectedProgram(null); setSelectedYears([]); setSelectedCourse(null); }}>
                            <span className={styles.breadcrumbDot} style={{ background: selectedFaculty.color }} />
                            {selectedFaculty.name}
                        </button>
                    </>
                )}
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

            {/* ── Faculties View ── */}
            {view === 'faculties' && (
                <div className={styles.gridView}>
                    <div className={styles.gridHeader}>
                        <div>
                            <h1 className={styles.gridTitle}>Факультеты</h1>
                            <p className={styles.gridSubtitle}>Выберите факультет для просмотра образовательных программ</p>
                        </div>
                    </div>
                    <div className={styles.cardGrid}>
                        {loading && Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                            </div>
                        ))}
                        {!loading && allFaculties.map((f) => (
                            <button key={f.id} className={styles.programCard} onClick={() => handleSelectFaculty(f)}>
                                <div className={styles.cardDeleteBtn} onClick={(e) => handleDeleteFaculty(e, f)} title="Удалить факультет">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                </div>
                                <div className={styles.programCardAccent} style={{ background: f.color }} />
                                <div className={styles.programCardBody}>
                                    <div className={styles.programCardTop}>
                                        {f.shortName && <span className={styles.programDegree} style={{ background: `${f.color}14`, color: f.color }}>{f.shortName}</span>}
                                    </div>
                                    <h3 className={styles.programName}>{f.name}</h3>
                                    <div className={styles.programStats}>
                                        <div className={styles.programStat}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2l-5 2.5 5 2.5 5-2.5L7 2z" stroke="currentColor" strokeWidth="1.2" /><path d="M2 7.5l5 2.5 5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                            <span>{f.programsCount} {f.programsCount === 1 ? 'программа' : f.programsCount < 5 ? 'программы' : 'программ'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.programCardArrow}>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </button>
                        ))}

                        {/* Create card — always visible */}
                        {!loading && (
                            <button className={styles.createCard} onClick={() => setShowCreateFaculty(true)}>
                                <div className={styles.createCardIcon}>
                                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 7v14M7 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                </div>
                                <span className={styles.createCardText}>Создать факультет</span>
                                <span className={styles.createCardHint}>Добавить новый факультет или институт</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Programs View ── */}
            {view === 'programs' && selectedFaculty && (
                <div className={styles.gridView}>
                    <div className={styles.gridHeader}>
                        <div>
                            <h1 className={styles.gridTitle}>{selectedFaculty.name}</h1>
                            <p className={styles.gridSubtitle}>Выберите программу для просмотра учебных планов и графов зависимостей</p>
                        </div>
                    </div>
                    <div className={styles.cardGrid}>
                        {loadingPrograms && Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                            </div>
                        ))}
                        {!loadingPrograms && (allPrograms[selectedFaculty.id] || []).map((p) => (
                            <button key={p.id} className={styles.programCard} onClick={() => handleSelectProgram(p)}>
                                <div className={styles.cardDeleteBtn} onClick={(e) => handleDeleteProgram(e, p)} title="Удалить программу">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                </div>
                                <div className={styles.programCardAccent} style={{ background: p.color }} />
                                <div className={styles.programCardBody}>
                                    <div className={styles.programCardTop}>
                                        <span className={styles.programDegree} style={{ background: `${p.color}14`, color: p.color }}>{p.degree}</span>
                                        <span className={styles.programCode}>{p.code}</span>
                                    </div>
                                    <h3 className={styles.programName}>{p.name}</h3>
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

                        {/* Create card — always visible */}
                        {!loadingPrograms && (
                            <button className={styles.createCard} onClick={() => setShowCreateProgram(true)}>
                                <div className={styles.createCardIcon}>
                                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 7v14M7 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                </div>
                                <span className={styles.createCardText}>Создать программу</span>
                                <span className={styles.createCardHint}>Добавить новую образовательную программу</span>
                            </button>
                        )}
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
                        {loadingYears && Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} style={{ height: 24 }} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                            </div>
                        ))}
                        {!loadingYears && (allYears[selectedProgram.id] || []).map((yp) => {
                            const isSelected = selectedYears.some((y) => y.id === yp.id);
                            const sc = statusConfig[yp.status];
                            return (
                                <button
                                    key={yp.id}
                                    className={`${styles.yearCard} ${isSelected ? styles.yearCardSelected : ''}`}
                                    onClick={() => handleToggleYear(yp)}
                                >
                                    <div className={styles.cardDeleteBtn} onClick={(e) => handleDeleteYear(e, yp)} title="Удалить когорту">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    </div>
                                    <div className={styles.yearCardTop}>
                                        <span className={styles.yearStatus} style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                                    </div>
                                    <span className={styles.yearNumber}>{yp.year}</span>
                                    <span className={styles.yearLabel}>{yp.label}</span>
                                    {isSelected && (
                                        <div className={styles.yearCardCheck}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    )}
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

                    {loadingGraph ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94A3B8', fontSize: 15 }}>Загрузка графа...</div>
                    ) : (
                    <GraphPanel
                        key={selectedYears[0].id}
                        label={selectedYears[0].label}
                        labelColor={selectedProgram.color}
                        initNodes={getGraphDataForYear(graphStore, selectedYears[0].id).nodes}
                        initEdges={getGraphDataForYear(graphStore, selectedYears[0].id).edges}
                        details={getGraphDataForYear(graphStore, selectedYears[0].id).details}
                        onSelectCourse={setSelectedCourse}
                        onDetailsChange={(d) => setGraphStore((prev) => ({ ...prev, [selectedYears[0].id]: { ...getGraphDataForYear(prev, selectedYears[0].id), details: d } }))}
                        onGraphSaved={(data) => setGraphStore((prev) => ({ ...prev, [selectedYears[0].id]: data }))}
                        cohortId={selectedYears[0].cohortId}
                        compact={isCompare}
                        readOnly={isCompare}
                        diff={compareDiff?.diffA}
                        durationYears={selectedProgram.durationYears}
                    />
                    )}

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
                                cohortId={selectedYears[1].cohortId}
                                compact
                                readOnly
                                diff={compareDiff?.diffB}
                                durationYears={selectedProgram.durationYears}
                            />
                        </>
                    )}
                </div>
            )}

            {/* Back button */}
            {view !== 'faculties' && (
                <button className={styles.backBtn} onClick={handleBack}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Назад
                </button>
            )}

            {/* Course detail panel */}
            {selectedCourse && (
                <CourseDetailPanel
                    course={selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                    onSave={handleSave}
                    cohortStudents={cohortStudents}
                    specializations={cohortSpecializations}
                    allTags={allTags}
                />
            )}

            {/* Create modals */}
            {showCreateFaculty && (
                <CreateFacultyModal
                    onClose={() => setShowCreateFaculty(false)}
                    existingCount={allFaculties.length}
                    onCreate={(f) => { setAllFaculties((prev) => [...prev, f]); setShowCreateFaculty(false); }}
                />
            )}
            {showCreateProgram && selectedFaculty && (
                <CreateProgramModal
                    onClose={() => setShowCreateProgram(false)}
                    existingCount={(allPrograms[selectedFaculty.id] || []).length}
                    facultyId={selectedFaculty.facultyId}
                    onCreate={(p) => {
                        setAllPrograms((prev) => ({ ...prev, [selectedFaculty.id]: [...(prev[selectedFaculty.id] || []), p] }));
                        setAllFaculties((prev) => prev.map((f) => f.id === selectedFaculty.id ? { ...f, programsCount: f.programsCount + 1 } : f));
                        setShowCreateProgram(false);
                    }}
                />
            )}
            {showCreateYear && selectedProgram && selectedFaculty && (
                <CreateYearModal
                    onClose={() => setShowCreateYear(false)}
                    existingYears={(allYears[selectedProgram.id] || []).map((y) => y.year)}
                    programId={selectedProgram.programId}
                    onCreate={(y) => {
                        setAllYears((prev) => ({ ...prev, [selectedProgram.id]: [y, ...(prev[selectedProgram.id] || [])] }));
                        setAllPrograms((prev) => ({
                            ...prev,
                            [selectedFaculty.id]: (prev[selectedFaculty.id] || []).map((prog) =>
                                prog.id === selectedProgram.id ? { ...prog, yearsCount: prog.yearsCount + 1 } : prog,
                            ),
                        }));
                        setShowCreateYear(false);
                    }}
                />
            )}

            {/* ── Delete confirmation modal ── */}
            {deleteConfirm && (
                <div className={styles.deleteBackdrop} onClick={() => !deleteLoading && setDeleteConfirm(null)}>
                    <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.deleteIcon}>
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <circle cx="14" cy="14" r="12" stroke="#EF4444" strokeWidth="1.5" />
                                <path d="M14 9v6M14 19v.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className={styles.deleteTitle}>{deleteConfirm.title}</h3>
                        <p className={styles.deleteMessage}>{deleteConfirm.message}</p>
                        <div className={styles.deleteActions}>
                            <button
                                className={styles.deleteCancelBtn}
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleteLoading}
                            >
                                Отмена
                            </button>
                            <button
                                className={styles.deleteConfirmBtn}
                                onClick={executeDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Удаление...' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
