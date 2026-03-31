import React, { useState, useEffect, useRef } from 'react';
import styles from './CourseDetailPanel.module.css';

interface Material {
    name: string;
    size: string;
    date: string;
    type: 'pdf' | 'pptx' | 'doc' | 'excel' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'link';
    url?: string;
}

interface Teacher {
    name: string;
    role: string;
    avatar: string;
}

interface CourseDetail {
    id: string;
    code: string;
    name: string;
    semester: string;
    type: 'required' | 'elective';
    credits: number;
    summary: string;
    students: { avatars: string[]; total: number };
    teachers: Teacher[];
    materials: Material[];
}

interface CourseDetailPanelProps {
    course: CourseDetail | null;
    onClose: () => void;
    onSave?: (updated: CourseDetail) => void;
}

const typeLabels: Record<string, { label: string; bg: string; color: string }> = {
    required: { label: 'ОБЯЗАТЕЛЬНО', bg: '#135BEC', color: '#fff' },
    elective: { label: 'ПО ВЫБОРУ', bg: '#F59E0B', color: '#fff' },
};

const iconBox = (bg: string, children: React.ReactNode) => (
    <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {children}
    </div>
);

const materialIcons: Record<Material['type'], React.ReactNode> = {
    pdf: iconBox('#FEE2E2',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#EF4444" strokeWidth="1.3" /><path d="M10.5 1.5V6h4.5" stroke="#EF4444" strokeWidth="1.3" /></svg>
    ),
    pptx: iconBox('#FFF7ED',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#EA580C" strokeWidth="1.3" /><path d="M10.5 1.5V6h4.5" stroke="#EA580C" strokeWidth="1.3" /><path d="M6 10l2.25-3 2.25 3" stroke="#EA580C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    doc: iconBox('#DBEAFE',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#3B82F6" strokeWidth="1.3" /><path d="M10.5 1.5V6h4.5" stroke="#3B82F6" strokeWidth="1.3" /><path d="M6 9h6M6 11.5h4" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" /></svg>
    ),
    excel: iconBox('#DCFCE7',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#16A34A" strokeWidth="1.3" /><path d="M10.5 1.5V6h4.5" stroke="#16A34A" strokeWidth="1.3" /><path d="M6 9h6M6 11.5h6M9 9v4" stroke="#16A34A" strokeWidth="1.1" strokeLinecap="round" /></svg>
    ),
    image: iconBox('#F3E8FF',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="#9333EA" strokeWidth="1.3" /><circle cx="6.5" cy="6.5" r="1.5" stroke="#9333EA" strokeWidth="1.2" /><path d="M2 12.5l4-4 3 3 2-2 5 5" stroke="#9333EA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    video: iconBox('#FCE7F3',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="3.75" width="10.5" height="10.5" rx="1.5" stroke="#DB2777" strokeWidth="1.3" /><path d="M12 7.5l4.5-2.25v7.5L12 10.5" stroke="#DB2777" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    audio: iconBox('#FFF1F2',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><ellipse cx="6" cy="13.5" rx="2.5" ry="2" stroke="#E11D48" strokeWidth="1.3" /><path d="M8.5 13.5V4l6 2" stroke="#E11D48" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><ellipse cx="11.5" cy="12.5" rx="2.5" ry="2" stroke="#E11D48" strokeWidth="1.3" /><path d="M14 12.5V6" stroke="#E11D48" strokeWidth="1.3" strokeLinecap="round" /></svg>
    ),
    archive: iconBox('#FEF9C3',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.75 6H2.25v9.75a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V6z" stroke="#CA8A04" strokeWidth="1.3" /><path d="M16.5 3.75A1.5 1.5 0 0015 2.25H3a1.5 1.5 0 00-1.5 1.5V6h15V3.75z" stroke="#CA8A04" strokeWidth="1.3" /><path d="M7.5 9.75h3" stroke="#CA8A04" strokeWidth="1.3" strokeLinecap="round" /></svg>
    ),
    code: iconBox('#FEF3C7',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.75 5.25L3 9l3.75 3.75M11.25 5.25L15 9l-3.75 3.75" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    link: iconBox('#DBEAFE',
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7.5 10.5a3.75 3.75 0 005.3 0l1.88-1.88a3.75 3.75 0 00-5.3-5.3L8.25 4.44" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M10.5 7.5a3.75 3.75 0 00-5.3 0L3.32 9.38a3.75 3.75 0 005.3 5.3l1.13-1.13" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
};

const getFileType = (filename: string): Material['type'] => {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['ppt', 'pptx'].includes(ext)) return 'pptx';
    if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'excel';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'wma', 'm4a'].includes(ext)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'archive';
    return 'code';
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TEACHER_ROLES = [
    'Лектор',
    'Практик',
    'Ассистент',
    'Семинарист',
    'Научный руководитель',
];

/* ── Mock directory data ── */
interface StudentEntry {
    id: string;
    name: string;
    group: string;
    groupColor: string;
    course: number;
    email: string;
    avatar: string;
    enrollmentYear: number;
}

interface TeacherEntry {
    id: string;
    name: string;
    department: string;
    email: string;
    avatar: string;
    degree: string;
}

const STUDENT_GROUPS = ['Все', 'ИВТ-102', 'ИВТ-302', 'М-ИИ-101', 'ЭК-201', 'Д-405', 'ПМ-201', 'КБ-301'];

const GROUP_COLORS: Record<string, string> = {
    'ИВТ-102': '#135BEC', 'ИВТ-302': '#135BEC', 'М-ИИ-101': '#8B5CF6',
    'ЭК-201': '#10B981', 'Д-405': '#F59E0B', 'ПМ-201': '#EF4444', 'КБ-301': '#06B6D4',
};

const allStudents: StudentEntry[] = [
    { id: 's1', name: 'Анна Смирнова', group: 'ИВТ-302', groupColor: '#135BEC', course: 3, email: 'smirnova@univ.ru', avatar: 'АС', enrollmentYear: 2023 },
    { id: 's2', name: 'Дмитрий Волков', group: 'М-ИИ-101', groupColor: '#8B5CF6', course: 1, email: 'volkov@univ.ru', avatar: 'ДВ', enrollmentYear: 2025 },
    { id: 's3', name: 'Елена Козлова', group: 'ЭК-201', groupColor: '#10B981', course: 2, email: 'kozlova@univ.ru', avatar: 'ЕК', enrollmentYear: 2024 },
    { id: 's4', name: 'София Андреева', group: 'Д-405', groupColor: '#F59E0B', course: 4, email: 'andreeva@univ.ru', avatar: 'СА', enrollmentYear: 2022 },
    { id: 's5', name: 'Максим Соколов', group: 'ИВТ-102', groupColor: '#135BEC', course: 1, email: 'sokolov@univ.ru', avatar: 'МС', enrollmentYear: 2025 },
    { id: 's6', name: 'Ирина Петрова', group: 'ИВТ-302', groupColor: '#135BEC', course: 3, email: 'petrova@univ.ru', avatar: 'ИП', enrollmentYear: 2023 },
    { id: 's7', name: 'Алексей Морозов', group: 'ПМ-201', groupColor: '#EF4444', course: 2, email: 'morozov@univ.ru', avatar: 'АМ', enrollmentYear: 2024 },
    { id: 's8', name: 'Мария Новикова', group: 'КБ-301', groupColor: '#06B6D4', course: 3, email: 'novikova@univ.ru', avatar: 'МН', enrollmentYear: 2023 },
    { id: 's9', name: 'Кирилл Федоров', group: 'М-ИИ-101', groupColor: '#8B5CF6', course: 1, email: 'fedorov@univ.ru', avatar: 'КФ', enrollmentYear: 2025 },
    { id: 's10', name: 'Ольга Белова', group: 'ЭК-201', groupColor: '#10B981', course: 2, email: 'belova@univ.ru', avatar: 'ОБ', enrollmentYear: 2024 },
    { id: 's11', name: 'Николай Сидоров', group: 'ИВТ-102', groupColor: '#135BEC', course: 1, email: 'sidorov@univ.ru', avatar: 'НС', enrollmentYear: 2025 },
    { id: 's12', name: 'Татьяна Кузнецова', group: 'Д-405', groupColor: '#F59E0B', course: 4, email: 'kuznetsova@univ.ru', avatar: 'ТК', enrollmentYear: 2022 },
];

const allTeachers: TeacherEntry[] = [
    { id: 't1', name: 'Иванов Сергей Петрович', department: 'Кафедра ИТ', email: 'ivanov@univ.ru', avatar: 'ИС', degree: 'к.т.н., доцент' },
    { id: 't2', name: 'Петрова Ольга Николаевна', department: 'Кафедра ИТ', email: 'petrova.on@univ.ru', avatar: 'ПО', degree: 'д.т.н., профессор' },
    { id: 't3', name: 'Сидоров Алексей Викторович', department: 'Кафедра ИИ', email: 'sidorov.av@univ.ru', avatar: 'СА', degree: 'к.ф.-м.н., доцент' },
    { id: 't4', name: 'Кузнецова Мария Ивановна', department: 'Кафедра математики', email: 'kuznetsova.mi@univ.ru', avatar: 'КМ', degree: 'к.ф.-м.н., ст. преп.' },
    { id: 't5', name: 'Морозов Дмитрий Алексеевич', department: 'Кафедра ИТ', email: 'morozov.da@univ.ru', avatar: 'МД', degree: 'к.т.н., доцент' },
    { id: 't6', name: 'Волкова Екатерина Сергеевна', department: 'Кафедра ИИ', email: 'volkova.es@univ.ru', avatar: 'ВЕ', degree: 'ассистент' },
    { id: 't7', name: 'Новиков Андрей Юрьевич', department: 'Кафедра экономики', email: 'novikov.ay@univ.ru', avatar: 'НА', degree: 'д.э.н., профессор' },
    { id: 't8', name: 'Белова Наталья Дмитриевна', department: 'Кафедра математики', email: 'belova.nd@univ.ru', avatar: 'БН', degree: 'к.ф.-м.н., доцент' },
];

/* ── Add Students Modal (multi-select picker) ── */
interface AddStudentModalProps {
    onClose: () => void;
    onAdd: (names: string[]) => void;
    existingNames: string[];
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose, onAdd, existingNames }) => {
    const [search, setSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('Все');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const filtered = allStudents.filter((s) => {
        if (existingNames.some((n) => n === s.name)) return false;
        if (groupFilter !== 'Все' && s.group !== groupFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return s.name.toLowerCase().includes(q) || s.group.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
        }
        return true;
    });

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSubmit = () => {
        const names = allStudents.filter((s) => selected.has(s.id)).map((s) => s.name);
        if (names.length > 0) onAdd(names);
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderIcon}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <path d="M15 7v6M12 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h3 className={styles.modalTitle}>Добавить студентов</h3>
                    {selected.size > 0 && (
                        <span className={styles.pickerSelectedBadge}>
                            {selected.size} выбр.
                        </span>
                    )}
                    <button className={styles.modalClose} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.pickerToolbar}>
                    <div className={styles.pickerSearch}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Поиск по ФИО, группе, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className={styles.pickerGroupFilter}>
                        {STUDENT_GROUPS.map((g) => (
                            <button
                                key={g}
                                className={`${styles.pickerGroupBtn} ${groupFilter === g ? styles.active : ''}`}
                                onClick={() => setGroupFilter(g)}
                            >
                                {g === 'Все' ? g : (
                                    <>
                                        <span className={styles.pickerGroupDot} style={{ background: GROUP_COLORS[g] || '#94A3B8' }} />
                                        {g}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.pickerList}>
                    {filtered.length === 0 ? (
                        <div className={styles.pickerEmpty}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <circle cx="20" cy="20" r="18" stroke="#E2E8F0" strokeWidth="2" />
                                <path d="M14 26c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="20" cy="16" r="4" stroke="#CBD5E1" strokeWidth="1.5" />
                            </svg>
                            <span>Студенты не найдены</span>
                        </div>
                    ) : (
                        filtered.map((student) => {
                            const isSelected = selected.has(student.id);
                            return (
                                <div
                                    key={student.id}
                                    className={`${styles.pickerCard} ${isSelected ? styles.pickerCardSelected : ''}`}
                                    onClick={() => toggle(student.id)}
                                >
                                    <div className={styles.pickerCheckbox}>
                                        {isSelected ? (
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <rect x="1" y="1" width="16" height="16" rx="4" fill="var(--primary)" stroke="var(--primary)" strokeWidth="1.5" />
                                                <path d="M5 9l2.5 2.5L13 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <rect x="1" y="1" width="16" height="16" rx="4" stroke="#CBD5E1" strokeWidth="1.5" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className={styles.pickerAvatar} style={{ background: `${student.groupColor}18`, color: student.groupColor }}>
                                        {student.avatar}
                                    </div>
                                    <div className={styles.pickerInfo}>
                                        <span className={styles.pickerName}>{student.name}</span>
                                        <span className={styles.pickerMeta}>
                                            <span className={styles.pickerGroup} style={{ color: student.groupColor }}>{student.group}</span>
                                            <span className={styles.pickerDot} />
                                            {student.course} курс
                                            <span className={styles.pickerDot} />
                                            {student.email}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className={styles.pickerFooter}>
                    <span className={styles.pickerFooterInfo}>
                        Найдено: {filtered.length}
                    </span>
                    <div className={styles.pickerFooterActions}>
                        <button type="button" className={styles.modalBtnCancel} onClick={onClose}>Отмена</button>
                        <button
                            type="button"
                            className={styles.modalBtnSave}
                            disabled={selected.size === 0}
                            onClick={handleSubmit}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Добавить {selected.size > 0 ? `(${selected.size})` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Add Teacher Modal (single-select picker + role) ── */
interface AddTeacherModalProps {
    onClose: () => void;
    onAdd: (teacher: Teacher) => void;
    existingNames: string[];
}

const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ onClose, onAdd, existingNames }) => {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [role, setRole] = useState(TEACHER_ROLES[0]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const filtered = allTeachers.filter((t) => {
        if (existingNames.some((n) => n === t.name)) return false;
        if (search) {
            const q = search.toLowerCase();
            return t.name.toLowerCase().includes(q) || t.department.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
        }
        return true;
    });

    const selectedTeacher = allTeachers.find((t) => t.id === selectedId);

    const handleSubmit = () => {
        if (!selectedTeacher) return;
        onAdd({
            name: selectedTeacher.name,
            role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTeacher.name)}&background=E0E7FF&color=135BEC&size=80`,
        });
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderIcon}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 3l-7 3.5 7 3.5 7-3.5-7-3.5z" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M3 10l7 3.5 7-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h3 className={styles.modalTitle}>Добавить преподавателя</h3>
                    <button className={styles.modalClose} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.pickerToolbar}>
                    <div className={styles.pickerSearch}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Поиск по ФИО, кафедре, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={styles.pickerList}>
                    {filtered.length === 0 ? (
                        <div className={styles.pickerEmpty}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <circle cx="20" cy="20" r="18" stroke="#E2E8F0" strokeWidth="2" />
                                <path d="M20 12l-8 4 8 4 8-4-8-4z" stroke="#CBD5E1" strokeWidth="1.5" />
                                <path d="M12 20l8 4 8-4" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span>Преподаватели не найдены</span>
                        </div>
                    ) : (
                        filtered.map((teacher) => {
                            const isSelected = selectedId === teacher.id;
                            return (
                                <div
                                    key={teacher.id}
                                    className={`${styles.pickerCard} ${isSelected ? styles.pickerCardSelected : ''}`}
                                    onClick={() => setSelectedId(isSelected ? null : teacher.id)}
                                >
                                    <div className={styles.pickerRadio}>
                                        {isSelected ? (
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <circle cx="9" cy="9" r="8" stroke="var(--primary)" strokeWidth="1.5" />
                                                <circle cx="9" cy="9" r="4.5" fill="var(--primary)" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <circle cx="9" cy="9" r="8" stroke="#CBD5E1" strokeWidth="1.5" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className={styles.pickerAvatar} style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                                        {teacher.avatar}
                                    </div>
                                    <div className={styles.pickerInfo}>
                                        <span className={styles.pickerName}>{teacher.name}</span>
                                        <span className={styles.pickerMeta}>
                                            <span style={{ color: '#7C3AED', fontWeight: 500 }}>{teacher.degree}</span>
                                            <span className={styles.pickerDot} />
                                            {teacher.department}
                                            <span className={styles.pickerDot} />
                                            {teacher.email}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {selectedTeacher && (
                    <div className={styles.pickerRoleBar}>
                        <span className={styles.pickerRoleLabel}>Роль на дисциплине:</span>
                        <div className={styles.pickerRoleTags}>
                            {TEACHER_ROLES.map((r) => (
                                <button
                                    key={r}
                                    className={`${styles.pickerRoleTag} ${role === r ? styles.active : ''}`}
                                    onClick={() => setRole(r)}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.pickerFooter}>
                    <span className={styles.pickerFooterInfo}>
                        Найдено: {filtered.length}
                    </span>
                    <div className={styles.pickerFooterActions}>
                        <button type="button" className={styles.modalBtnCancel} onClick={onClose}>Отмена</button>
                        <button
                            type="button"
                            className={styles.modalBtnSave}
                            disabled={!selectedId}
                            onClick={handleSubmit}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Добавить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Add Link Modal ── */
interface AddLinkModalProps {
    onClose: () => void;
    onAdd: (material: Material) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !url.trim()) return;
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        onAdd({ name: name.trim(), size: '', date: dateStr, type: 'link', url: url.trim() });
    };

    const isValid = name.trim().length > 0 && url.trim().length > 0;

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderIcon}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M8.33 11.67a4.17 4.17 0 005.89 0l2.08-2.09a4.17 4.17 0 00-5.89-5.89l-1.25 1.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M11.67 8.33a4.17 4.17 0 00-5.89 0L3.7 10.42a4.17 4.17 0 005.89 5.89l1.25-1.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h3 className={styles.modalTitle}>Добавить ссылку</h3>
                    <button className={styles.modalClose} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Название</label>
                        <input
                            className={styles.modalInput}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например: Лекция на YouTube"
                            autoFocus
                            required
                        />
                    </div>
                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>URL</label>
                        <input
                            className={styles.modalInput}
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            type="url"
                            required
                        />
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.modalBtnCancel} onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.modalBtnSave} disabled={!isValid}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Добавить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── Edit Modal ── */
interface EditForm {
    name: string;
    code: string;
    semester: string;
    type: 'required' | 'elective';
    credits: number;
    summary: string;
}

interface CourseEditModalProps {
    course: CourseDetail;
    onClose: () => void;
    onSave: (form: EditForm) => void;
}

const CourseEditModal: React.FC<CourseEditModalProps> = ({ course, onClose, onSave }) => {
    const [form, setForm] = useState<EditForm>({
        name: course.name,
        code: course.code,
        semester: course.semester,
        type: course.type,
        credits: course.credits,
        summary: course.summary,
    });

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Редактировать дисциплину</h3>
                    <button className={styles.modalClose} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    <div className={styles.modalRow}>
                        <div className={`${styles.modalField} ${styles.modalFieldGrow}`}>
                            <label className={styles.modalLabel}>Название дисциплины</label>
                            <input
                                className={styles.modalInput}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Название"
                                required
                            />
                        </div>
                        <div className={`${styles.modalField} ${styles.modalFieldShort}`}>
                            <label className={styles.modalLabel}>Код</label>
                            <input
                                className={styles.modalInput}
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                placeholder="CS-101"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.modalRow}>
                        <div className={`${styles.modalField} ${styles.modalFieldGrow}`}>
                            <label className={styles.modalLabel}>Семестр</label>
                            <input
                                className={styles.modalInput}
                                value={form.semester}
                                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                placeholder="Осенний семестр"
                            />
                        </div>
                        <div className={`${styles.modalField} ${styles.modalFieldMedium}`}>
                            <label className={styles.modalLabel}>Тип</label>
                            <div className={styles.modalSelectWrapper}>
                                <select
                                    className={styles.modalSelect}
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value as EditForm['type'] })}
                                >
                                    <option value="required">Обязательно</option>
                                    <option value="elective">По выбору</option>
                                </select>
                                <svg className={styles.modalSelectChevron} width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                        <div className={`${styles.modalField} ${styles.modalFieldShort}`}>
                            <label className={styles.modalLabel}>Часы</label>
                            <input
                                className={styles.modalInput}
                                type="number"
                                min={1}
                                max={12}
                                value={form.credits}
                                onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Описание</label>
                        <textarea
                            className={styles.modalTextarea}
                            value={form.summary}
                            onChange={(e) => setForm({ ...form, summary: e.target.value })}
                            placeholder="Краткое описание дисциплины..."
                            rows={4}
                        />
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.modalBtnCancel} onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.modalBtnSave}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13.333 2H4L2 4v9.333C2 13.7 2.3 14 2.667 14h10.666c.368 0 .667-.3.667-.667V2.667C14 2.3 13.7 2 13.333 2z" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M5.333 2v4h5.334V2M4.667 14V9.333h6.666V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── Detail Panel ── */
const CourseDetailPanel: React.FC<CourseDetailPanelProps> = ({ course, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!course) return null;

    const typeInfo = typeLabels[course.type] || typeLabels.core;

    const handleSave = (form: EditForm) => {
        onSave?.({ ...course, ...form });
        setIsEditing(false);
    };

    const handleAddStudents = (names: string[]) => {
        const newAvatars = names.map((n) =>
            `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=E0E7FF&color=135BEC&size=80`
        );
        onSave?.({
            ...course,
            students: {
                avatars: [...course.students.avatars, ...newAvatars],
                total: course.students.total + names.length,
            },
        });
        setIsAddingStudent(false);
    };

    const handleAddTeacher = (teacher: Teacher) => {
        onSave?.({
            ...course,
            teachers: [...course.teachers, teacher],
        });
        setIsAddingTeacher(false);
    };

    const handleAddLink = (material: Material) => {
        onSave?.({
            ...course,
            materials: [...course.materials, material],
        });
        setIsAddingLink(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const newMaterials: Material[] = Array.from(files).map((file) => ({
            name: file.name,
            size: formatFileSize(file.size),
            date: dateStr,
            type: getFileType(file.name),
        }));

        onSave?.({
            ...course,
            materials: [...course.materials, ...newMaterials],
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <div className={styles.panel}>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>

                    <div className={styles.header}>
                        <div className={styles.badges}>
                            <span className={styles.badge} style={{ background: typeInfo.bg, color: typeInfo.color }}>
                                {typeInfo.label}
                            </span>
                            <span className={`${styles.badge} ${styles.badgeOutline}`}>
                                {course.credits} ЧАСА
                            </span>
                        </div>
                        <h2 className={styles.title}>{course.name}</h2>
                        <p className={styles.subtitle}>{course.code} • {course.semester}</p>
                        <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Редактировать
                        </button>
                    </div>

                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M8 5v3M8 10v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            ОПИСАНИЕ
                        </h4>
                        <p className={styles.sectionText}>{course.summary}</p>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                                    <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                СТУДЕНТЫ
                                <span className={styles.sectionCount}>{course.students.total}</span>
                            </h4>
                            <button className={styles.addSmallBtn} onClick={() => setIsAddingStudent(true)}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Добавить
                            </button>
                        </div>
                        <div className={styles.studentsAvatars}>
                            {course.students.avatars.map((avatar, i) => (
                                <img
                                    key={i}
                                    src={avatar}
                                    alt="student"
                                    className={styles.studentAvatar}
                                    style={{ marginLeft: i > 0 ? -8 : 0, zIndex: course.students.avatars.length - i }}
                                />
                            ))}
                            {course.students.total > course.students.avatars.length && (
                                <span className={styles.studentsMore} style={{ marginLeft: -8 }}>
                                    +{course.students.total - course.students.avatars.length}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 2l-6 3 6 3 6-3-6-3z" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M2 8l6 3 6-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                ПРЕПОДАВАТЕЛИ
                                <span className={styles.sectionCount}>{course.teachers.length}</span>
                            </h4>
                            <button className={styles.addSmallBtn} onClick={() => setIsAddingTeacher(true)}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Добавить
                            </button>
                        </div>
                        {course.teachers.map((teacher, i) => (
                            <div key={i} className={styles.teacherRow}>
                                <img src={teacher.avatar} alt={teacher.name} className={styles.teacherAvatar} />
                                <div className={styles.teacherInfo}>
                                    <span className={styles.teacherName}>{teacher.name}</span>
                                    <span className={styles.teacherRole}>{teacher.role}</span>
                                </div>
                                <button className={styles.teacherEmail}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M2.667 2.667h10.666c.734 0 1.334.6 1.334 1.333v8c0 .733-.6 1.333-1.334 1.333H2.667c-.734 0-1.334-.6-1.334-1.333V4c0-.733.6-1.333 1.334-1.333z" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M14.667 4L8 8.667 1.333 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M14 10v3.333c0 .368-.298.667-.667.667H2.667A.667.667 0 012 13.333V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    <path d="M2 6.667h12V10a.667.667 0 01-.667.667H2.667A.667.667 0 012 10V6.667z" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M6.667 2h2.666l1.334 4.667H5.333L6.667 2z" stroke="currentColor" strokeWidth="1.2" />
                                </svg>
                                МАТЕРИАЛЫ
                                <span className={styles.sectionCount}>{course.materials.length}</span>
                            </h4>
                        </div>
                        <div className={styles.materialsList}>
                            {course.materials.map((material, i) => (
                                <div key={i} className={styles.materialRow}>
                                    {materialIcons[material.type]}
                                    <div className={styles.materialInfo}>
                                        {material.type === 'link' && material.url ? (
                                            <a href={material.url} target="_blank" rel="noopener noreferrer" className={styles.materialLink}>{material.name}</a>
                                        ) : (
                                            <span className={styles.materialName}>{material.name}</span>
                                        )}
                                        <span className={styles.materialMeta}>
                                            {material.type === 'link' ? material.date : `${material.size} • ${material.date}`}
                                        </span>
                                    </div>
                                    {material.type === 'link' && material.url ? (
                                        <a href={material.url} target="_blank" rel="noopener noreferrer" className={styles.materialDownload}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M12 8.667V12a1.333 1.333 0 01-1.333 1.333H3.333A1.333 1.333 0 012 12V4.667a1.333 1.333 0 011.333-1.334h3.334" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                                <path d="M10 2h4v4M6.667 9.333L14 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </a>
                                    ) : (
                                        <button className={styles.materialDownload}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                                <path d="M5.333 7.333L8 10l2.667-2.667M8 10V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className={styles.fileInputHidden}
                            onChange={handleFileUpload}
                            accept=".pdf,.ppt,.pptx,.doc,.docx,.odt,.rtf,.txt,.xls,.xlsx,.csv,.ods,.png,.jpg,.jpeg,.gif,.svg,.webp,.bmp,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.ogg,.flac,.aac,.m4a,.zip,.rar,.7z,.tar,.gz,.py,.js,.ts,.java,.cpp,.c"
                        />
                        <div className={styles.materialsActions}>
                            <button
                                className={styles.uploadBtn}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                    <path d="M10.667 5.333L8 2.667 5.333 5.333M8 2.667V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Добавить файл
                            </button>
                            <button
                                className={styles.uploadBtn}
                                onClick={() => setIsAddingLink(true)}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6.67 9.33a3.33 3.33 0 004.71 0l1.67-1.66a3.33 3.33 0 00-4.72-4.72L7.33 3.96" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9.33 6.67a3.33 3.33 0 00-4.71 0L2.95 8.33a3.33 3.33 0 004.72 4.72l1-1.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Добавить ссылку
                            </button>
                        </div>
                    </div>

                    <div className={styles.panelFooter}>
                        <button className={styles.historyBtn}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M8 4.667V8l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            История изменений
                        </button>
                    </div>
            </div>

            {isEditing && (
                <CourseEditModal
                    course={course}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSave}
                />
            )}

            {isAddingStudent && (
                <AddStudentModal
                    onClose={() => setIsAddingStudent(false)}
                    onAdd={handleAddStudents}
                    existingNames={[]}
                />
            )}

            {isAddingTeacher && (
                <AddTeacherModal
                    onClose={() => setIsAddingTeacher(false)}
                    onAdd={handleAddTeacher}
                    existingNames={course.teachers.map((t) => t.name)}
                />
            )}

            {isAddingLink && (
                <AddLinkModal
                    onClose={() => setIsAddingLink(false)}
                    onAdd={handleAddLink}
                />
            )}
        </>
    );
};

export default CourseDetailPanel;
export type { CourseDetail };
