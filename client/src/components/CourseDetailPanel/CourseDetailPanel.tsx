import React, { useState, useEffect, useRef } from 'react';
import type { StudentBase, Specialization, TagBase, UserWithRelations } from '../../api/types';
import { getUsers } from '../../api/users';
import styles from './CourseDetailPanel.module.css';

/* ── Types ── */

interface Material {
    name: string;
    size: string;
    date: string;
    type: 'pdf' | 'pptx' | 'doc' | 'excel' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'link';
    url?: string;
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
    teachers: { name: string; role: string; avatar: string; user_id?: number }[];
    materials: Material[];
    elective_students_ids?: number[];
    teachers_ids?: number[];
    tags?: TagBase[];
    specialization?: Specialization | null;
}

interface CourseDetailPanelProps {
    course: CourseDetail | null;
    onClose: () => void;
    onSave?: (updated: CourseDetail) => void;
    cohortStudents?: StudentBase[];
    specializations?: Specialization[];
    allTags?: TagBase[];
}

/* ── Helpers ── */

const typeLabels: Record<string, { label: string; bg: string; color: string }> = {
    required: { label: 'ОБЯЗАТЕЛЬНО', bg: '#135BEC', color: '#fff' },
    elective: { label: 'ПО ВЫБОРУ', bg: '#F59E0B', color: '#fff' },
};

const SPEC_COLORS = ['#135BEC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#0891B2', '#7C3AED', '#059669'];
const getSpecColor = (id: number): string => SPEC_COLORS[id % SPEC_COLORS.length];

const TAG_COLORS = ['#135BEC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#D97706', '#0891B2', '#DC2626'];
const getTagBgColor = (id: number): string => `${TAG_COLORS[id % TAG_COLORS.length]}14`;
const getTagTextColor = (id: number): string => TAG_COLORS[id % TAG_COLORS.length];

const fullName = (s: StudentBase): string =>
    [s.user.surname, s.user.name, s.user.patronymic].filter(Boolean).join(' ');

const getInitials = (s: StudentBase): string =>
    `${s.user.name?.charAt(0) || ''}${s.user.surname?.charAt(0) || ''}`.toUpperCase();

const AVATAR_COLORS = ['#135BEC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#0891B2'];
const getAvatarColor = (id: number): string => AVATAR_COLORS[id % AVATAR_COLORS.length];

const materialIcons: Record<Material['type'], React.ReactNode> = {
    pdf: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#EF4444" strokeWidth="1.3" /><path d="M10.5 1.5V6h4.5" stroke="#EF4444" strokeWidth="1.3" /></svg></div>,
    pptx: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#EA580C" strokeWidth="1.3" /></svg></div>,
    doc: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#3B82F6" strokeWidth="1.3" /></svg></div>,
    excel: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#16A34A" strokeWidth="1.3" /></svg></div>,
    image: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="#9333EA" strokeWidth="1.3" /></svg></div>,
    video: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="3.75" width="10.5" height="10.5" rx="1.5" stroke="#DB2777" strokeWidth="1.3" /></svg></div>,
    audio: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><ellipse cx="6" cy="13.5" rx="2.5" ry="2" stroke="#E11D48" strokeWidth="1.3" /></svg></div>,
    archive: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.75 6H2.25v9.75a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V6z" stroke="#CA8A04" strokeWidth="1.3" /></svg></div>,
    code: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.75 5.25L3 9l3.75 3.75M11.25 5.25L15 9l-3.75 3.75" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>,
    link: <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7.5 10.5a3.75 3.75 0 005.3 0l1.88-1.88a3.75 3.75 0 00-5.3-5.3L8.25 4.44" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M10.5 7.5a3.75 3.75 0 00-5.3 0L3.32 9.38a3.75 3.75 0 005.3 5.3l1.13-1.13" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>,
};

const getFileType = (filename: string): Material['type'] => {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['ppt', 'pptx'].includes(ext)) return 'pptx';
    if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'excel';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'code';
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ── Add Students Modal (real data) ── */
const AddStudentModal: React.FC<{
    onClose: () => void;
    onAdd: (studentIds: number[]) => void;
    cohortStudents: StudentBase[];
    specializations: Specialization[];
    enrolledIds: number[];
}> = ({ onClose, onAdd, cohortStudents, specializations, enrolledIds }) => {
    const [search, setSearch] = useState('');
    const [specFilter, setSpecFilter] = useState<number | 'all'>('all');
    const [selected, setSelected] = useState<Set<number>>(new Set());

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const filtered = cohortStudents.filter((s) => {
        if (enrolledIds.includes(s.student_id)) return false;
        if (specFilter !== 'all' && s.specialization_id !== specFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return fullName(s).toLowerCase().includes(q) ||
                (s.user.email || '').toLowerCase().includes(q) ||
                String(s.user.isu_id || '').includes(q);
        }
        return true;
    });

    const toggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
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
                    <h3 className={styles.modalTitle}>Записать студентов на курс</h3>
                    {selected.size > 0 && (
                        <span className={styles.pickerSelectedBadge}>{selected.size} выбр.</span>
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
                            placeholder="Поиск по ФИО, email, ISU ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {specializations.length > 0 && (
                        <div className={styles.pickerGroupFilter}>
                            <button
                                className={`${styles.pickerGroupBtn} ${specFilter === 'all' ? styles.active : ''}`}
                                onClick={() => setSpecFilter('all')}
                            >
                                Все
                            </button>
                            {specializations.map((s) => (
                                <button
                                    key={s.specialization_id}
                                    className={`${styles.pickerGroupBtn} ${specFilter === s.specialization_id ? styles.active : ''}`}
                                    onClick={() => setSpecFilter(s.specialization_id)}
                                >
                                    <span className={styles.pickerGroupDot} style={{ background: getSpecColor(s.specialization_id) }} />
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.pickerList}>
                    {filtered.length === 0 ? (
                        <div className={styles.pickerEmpty}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <circle cx="20" cy="20" r="18" stroke="#E2E8F0" strokeWidth="2" />
                                <path d="M14 26c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="20" cy="16" r="4" stroke="#CBD5E1" strokeWidth="1.5" />
                            </svg>
                            <span>{cohortStudents.length === 0 ? 'Нет студентов в когорте' : 'Все студенты уже записаны'}</span>
                        </div>
                    ) : filtered.map((student) => {
                        const isSelected = selected.has(student.student_id);
                        const specColor = student.specialization_id ? getSpecColor(student.specialization_id) : '#94A3B8';
                        const specName = specializations.find(sp => sp.specialization_id === student.specialization_id)?.name;
                        return (
                            <div
                                key={student.student_id}
                                className={`${styles.pickerCard} ${isSelected ? styles.pickerCardSelected : ''}`}
                                onClick={() => toggle(student.student_id)}
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
                                <div className={styles.pickerAvatar} style={{ background: `${getAvatarColor(student.student_id)}20`, color: getAvatarColor(student.student_id) }}>
                                    {getInitials(student)}
                                </div>
                                <div className={styles.pickerInfo}>
                                    <span className={styles.pickerName}>{fullName(student)}</span>
                                    <span className={styles.pickerMeta}>
                                        {specName && (
                                            <>
                                                <span style={{ color: specColor, fontWeight: 500 }}>{specName}</span>
                                                <span className={styles.pickerDot} />
                                            </>
                                        )}
                                        {student.user.email && <>{student.user.email}<span className={styles.pickerDot} /></>}
                                        {student.user.isu_id && <>ISU: {student.user.isu_id}</>}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.pickerFooter}>
                    <span className={styles.pickerFooterInfo}>Доступно: {filtered.length}</span>
                    <div className={styles.pickerFooterActions}>
                        <button type="button" className={styles.modalBtnCancel} onClick={onClose}>Отмена</button>
                        <button
                            type="button"
                            className={styles.modalBtnSave}
                            disabled={selected.size === 0}
                            onClick={() => { onAdd(Array.from(selected)); }}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Записать {selected.size > 0 ? `(${selected.size})` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Add Teacher Modal ── */
const TEACHER_ROLES = ['Лектор', 'Практик', 'Ассистент', 'Семинарист', 'Научный руководитель'];

const AddTeacherModal: React.FC<{
    onClose: () => void;
    onAdd: (teacher: { name: string; role: string; avatar: string; user_id: number }) => void;
    existingNames: string[];
}> = ({ onClose, onAdd, existingNames }) => {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<UserWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [role, setRole] = useState(TEACHER_ROLES[0]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    useEffect(() => {
        getUsers().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false));
    }, []);

    /* Show only users with teacher_data (role "Преподаватель") */
    const teacherUsers = users.filter(u => u.teacher_data && u.teacher_data.length > 0);

    const filtered = teacherUsers.filter(u => {
        const name = [u.surname, u.name, u.patronymic].filter(Boolean).join(' ');
        if (existingNames.includes(name)) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });

    const selectedUser = users.find(u => u.user_id === selectedId);

    const handleSubmit = () => {
        if (!selectedUser) return;
        const name = [selectedUser.surname, selectedUser.name, selectedUser.patronymic].filter(Boolean).join(' ');
        onAdd({
            name,
            role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E0E7FF&color=135BEC&size=80`,
            user_id: selectedUser.user_id,
        });
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={`${styles.modal} ${styles.modalWide}`} onClick={e => e.stopPropagation()}>
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
                            placeholder="Поиск по ФИО, email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={styles.pickerList}>
                    {loading ? (
                        <div className={styles.pickerEmpty}><span>Загрузка...</span></div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.pickerEmpty}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <circle cx="20" cy="20" r="18" stroke="#E2E8F0" strokeWidth="2" />
                                <path d="M20 12l-8 4 8 4 8-4-8-4z" stroke="#CBD5E1" strokeWidth="1.5" />
                                <path d="M12 20l8 4 8-4" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span>{search ? 'Ничего не найдено' : 'Нет доступных пользователей'}</span>
                        </div>
                    ) : filtered.map(user => {
                        const isSelected = selectedId === user.user_id;
                        const name = [user.surname, user.name, user.patronymic].filter(Boolean).join(' ');
                        const initials = `${user.name?.charAt(0) || ''}${user.surname?.charAt(0) || ''}`.toUpperCase();
                        return (
                            <div
                                key={user.user_id}
                                className={`${styles.pickerCard} ${isSelected ? styles.pickerCardSelected : ''}`}
                                onClick={() => setSelectedId(isSelected ? null : user.user_id)}
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
                                    {initials}
                                </div>
                                <div className={styles.pickerInfo}>
                                    <span className={styles.pickerName}>{name}</span>
                                    <span className={styles.pickerMeta}>
                                        {user.email && <>{user.email}</>}
                                        {user.teacher_data && user.teacher_data.length > 0 && (
                                            <><span className={styles.pickerDot} /><span style={{ color: '#16A34A', fontWeight: 500 }}>Преподаватель</span></>
                                        )}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedUser && (
                    <div className={styles.pickerRoleBar}>
                        <span className={styles.pickerRoleLabel}>Роль на дисциплине:</span>
                        <div className={styles.pickerRoleTags}>
                            {TEACHER_ROLES.map(r => (
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
                    <span className={styles.pickerFooterInfo}>Найдено: {filtered.length}</span>
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

/* ── Edit Modal ── */
interface EditForm {
    name: string;
    code: string;
    semester: string;
    type: 'required' | 'elective';
    credits: number;
    summary: string;
    specialization_id: number | null;
    tags_ids: number[];
}

const CourseEditModal: React.FC<{
    course: CourseDetail;
    specializations: Specialization[];
    allTags: TagBase[];
    onClose: () => void;
    onSave: (form: EditForm) => void;
}> = ({ course, specializations, allTags, onClose, onSave }) => {
    const [form, setForm] = useState<EditForm>({
        name: course.name,
        code: course.code,
        semester: course.semester,
        type: course.type,
        credits: course.credits,
        summary: course.summary,
        specialization_id: course.specialization?.specialization_id ?? null,
        tags_ids: course.tags?.map(t => t.tag_id) ?? [],
    });

    useEffect(() => {
        setForm({
            name: course.name, code: course.code, semester: course.semester,
            type: course.type, credits: course.credits, summary: course.summary,
            specialization_id: course.specialization?.specialization_id ?? null,
            tags_ids: course.tags?.map(t => t.tag_id) ?? [],
        });
    }, [course.id]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const toggleTag = (tagId: number) => {
        setForm(f => ({
            ...f,
            tags_ids: f.tags_ids.includes(tagId) ? f.tags_ids.filter(id => id !== tagId) : [...f.tags_ids, tagId],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

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
                            <label className={styles.modalLabel}>Название</label>
                            <input className={styles.modalInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className={`${styles.modalField} ${styles.modalFieldShort}`}>
                            <label className={styles.modalLabel}>Код</label>
                            <input className={styles.modalInput} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                        </div>
                    </div>

                    <div className={styles.modalRow}>
                        <div className={`${styles.modalField} ${styles.modalFieldGrow}`}>
                            <label className={styles.modalLabel}>Семестр</label>
                            <div className={styles.modalSelectWrapper}>
                                <select className={styles.modalSelect} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                        <option key={n} value={`${n} семестр`}>{n} семестр</option>
                                    ))}
                                </select>
                                <svg className={styles.modalSelectChevron} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                            </div>
                        </div>
                        <div className={`${styles.modalField} ${styles.modalFieldMedium}`}>
                            <label className={styles.modalLabel}>Тип</label>
                            <div className={styles.modalSelectWrapper}>
                                <select className={styles.modalSelect} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'required' | 'elective' })}>
                                    <option value="required">Обязательно</option>
                                    <option value="elective">По выбору</option>
                                </select>
                                <svg className={styles.modalSelectChevron} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                            </div>
                        </div>
                        <div className={`${styles.modalField} ${styles.modalFieldShort}`}>
                            <label className={styles.modalLabel}>Часы</label>
                            <input className={styles.modalInput} type="number" min={1} max={12} value={form.credits === 0 ? '' : form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value === '' ? 0 : Number(e.target.value) })} />
                        </div>
                    </div>

                    {/* Specialization */}
                    {specializations.length > 0 && (
                        <div className={styles.modalField}>
                            <label className={styles.modalLabel}>Специализация</label>
                            <div className={styles.modalSelectWrapper}>
                                <select
                                    className={styles.modalSelect}
                                    value={form.specialization_id ?? ''}
                                    onChange={(e) => setForm({ ...form, specialization_id: e.target.value ? Number(e.target.value) : null })}
                                >
                                    <option value="">Без специализации</option>
                                    {specializations.map(s => (
                                        <option key={s.specialization_id} value={s.specialization_id}>{s.name}</option>
                                    ))}
                                </select>
                                <svg className={styles.modalSelectChevron} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {allTags.length > 0 && (
                        <div className={styles.modalField}>
                            <label className={styles.modalLabel}>Теги</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {allTags.map(tag => {
                                    const isActive = form.tags_ids.includes(tag.tag_id);
                                    return (
                                        <button
                                            key={tag.tag_id}
                                            type="button"
                                            onClick={() => toggleTag(tag.tag_id)}
                                            style={{
                                                padding: '4px 12px', borderRadius: 6, border: '1px solid',
                                                borderColor: isActive ? getTagTextColor(tag.tag_id) + '60' : 'var(--border)',
                                                background: isActive ? getTagBgColor(tag.tag_id) : '#fff',
                                                color: isActive ? getTagTextColor(tag.tag_id) : 'var(--text-secondary)',
                                                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>Описание</label>
                        <textarea className={styles.modalTextarea} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} />
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.modalBtnCancel} onClick={onClose}>Отмена</button>
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

/* ── Add Link Modal ── */
const AddLinkModal: React.FC<{ onClose: () => void; onAdd: (m: Material) => void }> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !url.trim()) return;
        const dateStr = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        onAdd({ name: name.trim(), size: '', date: dateStr, type: 'link', url: url.trim() });
    };

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
                        <input className={styles.modalInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Лекция на YouTube" autoFocus required />
                    </div>
                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>URL</label>
                        <input className={styles.modalInput} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." type="url" required />
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.modalBtnCancel} onClick={onClose}>Отмена</button>
                        <button type="submit" className={styles.modalBtnSave} disabled={!name.trim() || !url.trim()}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                            Добавить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════ */
/* ── Detail Panel ── */
/* ══════════════════════════════════════════════════════ */

const StudentRow: React.FC<{ s: StudentBase; specName?: string; onRemove?: () => void }> = ({ s, specName, onRemove }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 8 }}>
        <div style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
            background: `${getAvatarColor(s.student_id)}20`, color: getAvatarColor(s.student_id), flexShrink: 0,
        }}>
            {getInitials(s)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{fullName(s)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {specName || ''}{specName && s.user.email ? ' · ' : ''}{s.user.email || ''}
            </div>
        </div>
        {onRemove && (
            <button onClick={onRemove} style={{ width: 24, height: 24, border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Отчислить с курса">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
        )}
    </div>
);

const CourseDetailPanel: React.FC<CourseDetailPanelProps> = ({
    course, onClose, onSave, cohortStudents = [], specializations = [], allTags = [],
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [studentsExpanded, setStudentsExpanded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!course) return null;

    const typeInfo = typeLabels[course.type] || typeLabels.required;
    const enrolledIds = course.elective_students_ids || [];
    const enrolledStudents = cohortStudents.filter(s => enrolledIds.includes(s.student_id));
    const hasSpecialization = !!course.specialization;
    const specStudents = hasSpecialization
        ? cohortStudents.filter(s => s.specialization_id === course.specialization!.specialization_id)
        : [];

    const handleSaveEdit = (form: EditForm) => {
        const matchedTags = allTags.filter(t => form.tags_ids.includes(t.tag_id));
        const matchedSpec = specializations.find(s => s.specialization_id === form.specialization_id) ?? null;
        onSave?.({
            ...course,
            name: form.name, code: form.code, semester: form.semester,
            type: form.type, credits: form.credits, summary: form.summary,
            tags: matchedTags, specialization: matchedSpec,
        });
        setIsEditing(false);
    };

    const handleAddStudents = (studentIds: number[]) => {
        const newIds = [...enrolledIds, ...studentIds];
        onSave?.({ ...course, elective_students_ids: newIds, students: { ...course.students, total: newIds.length } });
        setIsAddingStudent(false);
    };

    const handleRemoveStudent = (studentId: number) => {
        const newIds = enrolledIds.filter(id => id !== studentId);
        onSave?.({ ...course, elective_students_ids: newIds, students: { ...course.students, total: newIds.length } });
    };

    const handleAddTeacher = (teacher: { name: string; role: string; avatar: string; user_id?: number }) => {
        const newTeachers = [...course.teachers, teacher];
        const newIds = newTeachers.map(t => t.user_id).filter((id): id is number => id != null);
        onSave?.({ ...course, teachers: newTeachers, teachers_ids: newIds });
        setIsAddingTeacher(false);
    };

    const handleRemoveTeacher = (index: number) => {
        const newTeachers = course.teachers.filter((_, i) => i !== index);
        const newIds = newTeachers.map(t => t.user_id).filter((id): id is number => id != null);
        onSave?.({ ...course, teachers: newTeachers, teachers_ids: newIds });
    };

    const handleAddLink = (material: Material) => {
        onSave?.({ ...course, materials: [...course.materials, material] });
        setIsAddingLink(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const dateStr = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const newMats: Material[] = Array.from(files).map(f => ({ name: f.name, size: formatFileSize(f.size), date: dateStr, type: getFileType(f.name) }));
        onSave?.({ ...course, materials: [...course.materials, ...newMats] });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            <div className={styles.panel}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.badges}>
                        <span className={styles.badge} style={{ background: typeInfo.bg, color: typeInfo.color }}>{typeInfo.label}</span>
                        <span className={`${styles.badge} ${styles.badgeOutline}`}>{course.credits} ЧАСА</span>
                    </div>
                    <h2 className={styles.title}>
                        {course.name}
                        {course.specialization && (
                            <span style={{
                                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 4, marginLeft: 8,
                                background: getSpecColor(course.specialization.specialization_id) + '14',
                                color: getSpecColor(course.specialization.specialization_id),
                                verticalAlign: 'middle', display: 'inline-block', position: 'relative', top: -2,
                            }}>
                                {course.specialization.name}
                            </span>
                        )}
                    </h2>
                    <p className={styles.subtitle}>{course.code} • {course.semester}</p>

                    {/* Tags */}
                    {course.tags && course.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, marginBottom: 4 }}>
                            {course.tags.map(tag => (
                                <span key={tag.tag_id} style={{
                                    fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 4,
                                    background: getTagBgColor(tag.tag_id), color: getTagTextColor(tag.tag_id),
                                }}>
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Редактировать
                    </button>
                </div>

                {/* Description */}
                {course.summary && (
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
                )}

                {/* Students */}
                <div className={styles.section}>
                    {(() => {
                        /* Determine which students to show */
                        let displayStudents: StudentBase[];
                        let canManualEnroll = false;
                        let emptyLabel: string;

                        if (hasSpecialization) {
                            /* Course has specialization → show students of that specialization */
                            displayStudents = specStudents;
                            emptyLabel = `Нет студентов в специализации «${course.specialization!.name}»`;
                        } else if (course.type === 'elective') {
                            /* Elective without specialization → manual enrollment */
                            displayStudents = enrolledStudents;
                            canManualEnroll = true;
                            emptyLabel = 'Нет записанных студентов';
                        } else {
                            /* Required without specialization → all cohort students */
                            displayStudents = cohortStudents;
                            emptyLabel = 'Нет студентов в когорте';
                        }

                        return (<>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                            СТУДЕНТЫ
                            <span className={styles.sectionCount}>{displayStudents.length}</span>
                        </h4>
                        {canManualEnroll && (
                            <button className={styles.addSmallBtn} onClick={() => setIsAddingStudent(true)}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Записать
                            </button>
                        )}
                    </div>

                    {(() => {
                        if (displayStudents.length === 0) {
                            return (
                                <div className={styles.electiveStudentsInfo}>
                                    <span className={styles.electiveStudentsHint}>{emptyLabel}</span>
                                </div>
                            );
                        }
                        const PREVIEW_COUNT = 5;
                        const visibleStudents = studentsExpanded ? displayStudents : displayStudents.slice(0, PREVIEW_COUNT);
                        const hasMore = displayStudents.length > PREVIEW_COUNT;
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {visibleStudents.map(s => (
                                    <StudentRow
                                        key={s.student_id}
                                        s={s}
                                        specName={specializations.find(sp => sp.specialization_id === s.specialization_id)?.name}
                                        onRemove={canManualEnroll ? () => handleRemoveStudent(s.student_id) : undefined}
                                    />
                                ))}
                                {hasMore && (
                                    <button
                                        onClick={() => setStudentsExpanded(!studentsExpanded)}
                                        style={{
                                            border: 'none', background: 'none', color: 'var(--primary)',
                                            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 0',
                                            textAlign: 'left', fontFamily: 'inherit',
                                        }}
                                    >
                                        {studentsExpanded
                                            ? 'Свернуть'
                                            : `Показать всех (${displayStudents.length})`}
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                    </>);
                    })()}
                </div>

                {/* Teachers */}
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
                            <button
                                onClick={() => handleRemoveTeacher(i)}
                                style={{ width: 24, height: 24, border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Удалить"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                    ))}

                    {course.teachers.length === 0 && (
                        <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                            Преподаватели не назначены
                        </div>
                    )}
                </div>

                {/* Materials */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                <path d="M2 6.667h12V10a.667.667 0 01-.667.667H2.667A.667.667 0 012 10V6.667z" stroke="currentColor" strokeWidth="1.2" />
                            </svg>
                            МАТЕРИАЛЫ
                            <span className={styles.sectionCount}>{course.materials.length}</span>
                        </h4>
                    </div>
                    <div className={styles.materialsList}>
                        {course.materials.map((m, i) => (
                            <div key={i} className={styles.materialRow}>
                                {materialIcons[m.type]}
                                <div className={styles.materialInfo}>
                                    {m.type === 'link' && m.url ? (
                                        <a href={m.url} target="_blank" rel="noopener noreferrer" className={styles.materialLink}>{m.name}</a>
                                    ) : (
                                        <span className={styles.materialName}>{m.name}</span>
                                    )}
                                    <span className={styles.materialMeta}>{m.type === 'link' ? m.date : `${m.size} • ${m.date}`}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <input ref={fileInputRef} type="file" multiple className={styles.fileInputHidden} onChange={handleFileUpload} />
                    <div className={styles.materialsActions}>
                        <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                <path d="M10.667 5.333L8 2.667 5.333 5.333M8 2.667V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Добавить файл
                        </button>
                        <button className={styles.uploadBtn} onClick={() => setIsAddingLink(true)}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M6.67 9.33a3.33 3.33 0 004.71 0l1.67-1.66a3.33 3.33 0 00-4.72-4.72L7.33 3.96" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M9.33 6.67a3.33 3.33 0 00-4.71 0L2.95 8.33a3.33 3.33 0 004.72 4.72l1-1.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Добавить ссылку
                        </button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <CourseEditModal
                    course={course}
                    specializations={specializations}
                    allTags={allTags}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSaveEdit}
                />
            )}

            {isAddingStudent && (
                <AddStudentModal
                    onClose={() => setIsAddingStudent(false)}
                    onAdd={handleAddStudents}
                    cohortStudents={cohortStudents}
                    specializations={specializations}
                    enrolledIds={enrolledIds}
                />
            )}

            {isAddingTeacher && (
                <AddTeacherModal
                    onClose={() => setIsAddingTeacher(false)}
                    onAdd={handleAddTeacher}
                    existingNames={course.teachers.map(t => t.name)}
                />
            )}

            {isAddingLink && (
                <AddLinkModal onClose={() => setIsAddingLink(false)} onAdd={handleAddLink} />
            )}
        </>
    );
};

export default CourseDetailPanel;
export type { CourseDetail };
