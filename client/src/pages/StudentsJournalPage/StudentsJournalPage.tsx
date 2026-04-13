import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../components/Toast';
import { getPrograms, getProgram } from '../../api/programs';
import { getCohortStudents, updateCohortStudents } from '../../api/cohorts';
import { createStudent, deleteStudent } from '../../api/students';
import type {
    ProgramResponse,
    ProgramWithRelations,
    CohortInProgram,
    StudentBase,
    Specialization,
} from '../../api/types';
import styles from './StudentsJournalPage.module.css';

/* ── Helpers ── */

const getInitials = (name: string, surname: string): string => {
    const n = name?.charAt(0) || '';
    const s = surname?.charAt(0) || '';
    return `${n}${s}`.toUpperCase();
};

const AVATAR_COLORS = ['#135BEC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#0891B2', '#D97706', '#DC2626'];
const getAvatarColor = (id: number): string => AVATAR_COLORS[id % AVATAR_COLORS.length];

const SPEC_COLORS = ['#135BEC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#0891B2', '#7C3AED', '#059669'];
const getSpecColor = (id: number): string => SPEC_COLORS[id % SPEC_COLORS.length];

const fullName = (s: StudentBase): string =>
    [s.user.surname, s.user.name, s.user.patronymic].filter(Boolean).join(' ');

/* ── Custom Select ── */
interface SelectOption { value: number; label: string }

const CustomSelect: React.FC<{
    options: SelectOption[];
    value: number | null | undefined;
    onChange: (val: number) => void;
    placeholder?: string;
    disabled?: boolean;
    width?: number | string;
    allowClear?: boolean;
    onClear?: () => void;
}> = ({ options, value, onChange, placeholder = 'Выберите...', disabled, width, allowClear, onClear }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find((o) => o.value === value);

    return (
        <div className={`${styles.select} ${disabled ? styles.selectDisabled : ''}`} ref={ref} style={{ width }}>
            <button className={styles.selectTrigger} onClick={() => !disabled && setOpen(!open)} type="button">
                <span className={selected ? styles.selectValue : styles.selectPlaceholder}>
                    {selected?.label || placeholder}
                </span>
                <span className={styles.selectIcons}>
                    {allowClear && selected && (
                        <span className={styles.selectClear} onClick={(e) => { e.stopPropagation(); onClear?.(); setOpen(false); }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                        </span>
                    )}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`${styles.selectChevron} ${open ? styles.selectChevronUp : ''}`}>
                        <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>
            {open && (
                <div className={styles.selectDropdown}>
                    {options.length === 0 ? (
                        <div className={styles.selectEmpty}>Нет вариантов</div>
                    ) : options.map((o) => (
                        <div
                            key={o.value}
                            className={`${styles.selectOption} ${o.value === value ? styles.selectOptionActive : ''}`}
                            onClick={() => { onChange(o.value); setOpen(false); }}
                        >
                            {o.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Custom Modal ── */
const ModalDialog: React.FC<{
    open: boolean;
    title: string;
    onClose: () => void;
    onOk?: () => void;
    okText?: string;
    cancelText?: string;
    okLoading?: boolean;
    okDanger?: boolean;
    okDisabled?: boolean;
    wide?: boolean;
    children: React.ReactNode;
}> = ({ open, title, onClose, onOk, okText = 'OK', cancelText = 'Отмена', okLoading, okDanger, okDisabled, wide, children }) => {
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={`${styles.modal} ${wide ? styles.modalWide : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>{title}</h3>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <div className={styles.modalBody}>{children}</div>
                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose}>{cancelText}</button>
                    {onOk && (
                        <button
                            className={okDanger ? styles.btnDanger : styles.btnPrimary}
                            onClick={onOk}
                            disabled={okLoading || okDisabled}
                        >
                            {okLoading && <span className={styles.spinner} />}
                            {okText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Skeleton Card ── */
const SkeletonCard: React.FC = () => (
    <div className={styles.card} style={{ borderTopColor: '#E2E8F0' }}>
        <div className={styles.cardHeader}>
            <div className={styles.skeleton} style={{ width: 60, height: 60, borderRadius: '50%' }} />
        </div>
        <div className={styles.cardBody}>
            <div className={styles.skeleton} style={{ width: '70%', height: 18, borderRadius: 6, marginBottom: 8 }} />
            <div className={styles.skeleton} style={{ width: '50%', height: 14, borderRadius: 6, marginBottom: 10 }} />
            <div className={styles.skeleton} style={{ width: '40%', height: 22, borderRadius: 6 }} />
        </div>
    </div>
);

/* ═══════════════════════════════════════════ */

const StudentsJournalPage: React.FC = () => {
    const toast = useToast();

    /* ── Program / cohort selectors ── */
    const [programs, setPrograms] = useState<ProgramResponse[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
    const [cohorts, setCohorts] = useState<CohortInProgram[]>([]);
    const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);

    /* ── Students data ── */
    const [students, setStudents] = useState<StudentBase[]>([]);
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [loading, setLoading] = useState(false);

    /* ── Filters ── */
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSpecId, setActiveSpecId] = useState<number | 'all'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    /* ── Add student modal ── */
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addUserId, setAddUserId] = useState('');
    const [addSpecId, setAddSpecId] = useState<number | null>(null);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');

    /* ── Edit specialization modal ── */
    const [editStudent, setEditStudent] = useState<StudentBase | null>(null);
    const [editSpecId, setEditSpecId] = useState<number | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    /* ── Delete confirm modal ── */
    const [deleteTarget, setDeleteTarget] = useState<StudentBase | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    /* ── Load programs on mount ── */
    useEffect(() => {
        getPrograms().then((progs) => {
            setPrograms(progs);
            if (progs.length > 0) setSelectedProgramId(progs[0].program_id);
        }).catch(() => toast.error('Не удалось загрузить программы'));
    }, []);

    /* ── Load cohorts when program changes ── */
    useEffect(() => {
        if (!selectedProgramId) return;
        setCohorts([]);
        setSelectedCohortId(null);
        setStudents([]);
        getProgram(selectedProgramId).then((prog: ProgramWithRelations) => {
            setCohorts(prog.cohorts || []);
            if (prog.cohorts?.length > 0) {
                setSelectedCohortId(prog.cohorts[0].cohort_id);
            }
        }).catch(() => toast.error('Не удалось загрузить когорты'));
    }, [selectedProgramId]);

    /* ── Load students when cohort changes ── */
    const loadStudents = useCallback(async () => {
        if (!selectedCohortId) return;
        setLoading(true);
        try {
            const resp = await getCohortStudents(selectedCohortId);
            setStudents(resp.students ?? []);
            setSpecializations(resp.specializations ?? []);
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
                /* Эндпоинт ещё не доступен — показываем пустой список */
                setStudents([]);
                setSpecializations([]);
            } else {
                toast.error('Не удалось загрузить студентов');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedCohortId]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    /* ── Filtered students ── */
    const filtered = students.filter((s) => {
        if (activeSpecId !== 'all' && s.specialization_id !== activeSpecId) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const name = fullName(s).toLowerCase();
            const email = (s.user.email || '').toLowerCase();
            const isuId = String(s.user.isu_id || '');
            if (!name.includes(q) && !email.includes(q) && !isuId.includes(q)) return false;
        }
        return true;
    });

    const unassigned = students.filter((s) => !s.specialization_id);

    /* ── Handlers ── */
    const handleAddStudent = async () => {
        const userId = Number(addUserId);
        if (!userId || !selectedCohortId) {
            setAddError('Введите корректный User ID');
            return;
        }
        setAddError('');
        setAddLoading(true);
        try {
            const newStudent = await createStudent({ user_id: userId, cohort_id: selectedCohortId });
            /* Если выбрана специализация — сразу обновляем */
            if (addSpecId && newStudent?.student_id) {
                try {
                    await updateCohortStudents(selectedCohortId, [
                        { student_id: newStudent.student_id, specialization_id: addSpecId },
                    ]);
                } catch { /* не критично, можно назначить позже */ }
            }
            toast.success('Студент зачислен в когорту');
            setAddModalOpen(false);
            setAddUserId('');
            setAddSpecId(null);
            setAddError('');
            loadStudents();
        } catch (err: unknown) {
            const msg = (err instanceof Error ? err.message : '') ||
                'Не удалось добавить студента. Проверьте User ID.';
            setAddError(msg);
        } finally {
            setAddLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteStudent(deleteTarget.student_id);
            toast.success('Студент удалён из когорты');
            setDeleteTarget(null);
            loadStudents();
        } catch {
            toast.error('Не удалось удалить студента');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSaveSpecialization = async () => {
        if (!editStudent || !selectedCohortId) return;
        setEditLoading(true);
        try {
            await updateCohortStudents(selectedCohortId, [
                { student_id: editStudent.student_id, specialization_id: editSpecId },
            ]);
            toast.success('Специализация обновлена');
            setEditStudent(null);
            loadStudents();
        } catch {
            toast.error('Не удалось обновить специализацию');
        } finally {
            setEditLoading(false);
        }
    };

    const getSpecName = (specId: number | null): string => {
        if (!specId) return 'Не назначена';
        return specializations.find((s) => s.specialization_id === specId)?.name || `Спец. #${specId}`;
    };

    const selectedCohortLabel = cohorts.find((c) => c.cohort_id === selectedCohortId);

    return (
        <div className={styles.page}>
            {/* ── Header ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <h1>Журнал студентов</h1>
                    <p>Список студентов года набора с разбивкой по специализациям</p>
                </div>
                <div className={styles.pageHeaderRight}>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Сетка"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                <rect x="10.5" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                <rect x="2" y="10.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                <rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </button>
                        <button
                            className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                            onClick={() => setViewMode('list')}
                            title="Список"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M3 4.5h12M3 9h12M3 13.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                    <button className={styles.btnAdd} onClick={() => setAddModalOpen(true)} disabled={!selectedCohortId}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Добавить студента
                    </button>
                </div>
            </div>

            {/* ── Program & Cohort selectors ── */}
            <div className={styles.selectors}>
                <div className={styles.selectorGroup}>
                    <label className={styles.selectorLabel}>Программа</label>
                    <CustomSelect
                        width={320}
                        value={selectedProgramId}
                        onChange={(val) => setSelectedProgramId(val)}
                        placeholder="Выберите программу"
                        options={programs.map((p) => ({ value: p.program_id, label: p.name }))}
                    />
                </div>
                <div className={styles.selectorGroup}>
                    <label className={styles.selectorLabel}>Год набора</label>
                    <CustomSelect
                        width={200}
                        value={selectedCohortId}
                        onChange={(val) => setSelectedCohortId(val)}
                        placeholder="Выберите когорту"
                        disabled={cohorts.length === 0}
                        options={cohorts.map((c) => ({ value: c.cohort_id, label: `${c.cohort_year}/${c.cohort_year + 1}` }))}
                    />
                </div>
                {selectedCohortId && (
                    <div className={styles.statsRow}>
                        <span className={styles.statBadge}>Всего: {students.length}</span>
                        {unassigned.length > 0 && (
                            <span className={styles.statBadgeWarn}>Без специализации: {unassigned.length}</span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Specialization tabs ── */}
            {specializations.length > 0 && (
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeSpecId === 'all' ? styles.active : ''}`}
                        onClick={() => setActiveSpecId('all')}
                    >
                        <span>Все</span>
                        <span className={styles.tabCount}>{students.length}</span>
                    </button>
                    {specializations.map((spec) => {
                        const count = students.filter((s) => s.specialization_id === spec.specialization_id).length;
                        return (
                            <button
                                key={spec.specialization_id}
                                className={`${styles.tab} ${activeSpecId === spec.specialization_id ? styles.active : ''}`}
                                onClick={() => setActiveSpecId(spec.specialization_id)}
                            >
                                <span className={styles.specDot} style={{ background: getSpecColor(spec.specialization_id) }} />
                                <span>{spec.name}</span>
                                <span className={styles.tabCount}>{count}</span>
                            </button>
                        );
                    })}
                    {unassigned.length > 0 && (
                        <button
                            className={`${styles.tab} ${activeSpecId === 0 ? styles.active : ''}`}
                            onClick={() => setActiveSpecId(0 as unknown as number)}
                        >
                            <span>Без специализации</span>
                            <span className={styles.tabCount}>{unassigned.length}</span>
                        </button>
                    )}
                </div>
            )}

            {/* ── Search ── */}
            <div className={styles.filtersBar}>
                <div className={styles.searchWrapper}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Поиск по имени, email или ISU ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div className={styles.grid} style={{ borderRadius: '0 0 var(--radius) var(--radius)' }}>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : !selectedCohortId ? (
                <div className={styles.centered}>
                    <div className={styles.emptyIcon}>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="22" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="20" cy="18" r="5" stroke="#CBD5E1" strokeWidth="1.5" />
                            <path d="M10 38c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M33 20v8M29 24h8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <p className={styles.emptyText}>Выберите программу и год набора</p>
                    <p className={styles.emptyHint}>для просмотра списка студентов</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.centered}>
                    <div className={styles.emptyIcon}>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="22" stroke="#E2E8F0" strokeWidth="2" />
                            <path d="M18 30s2-3 6-3 6 3 6 3" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="18" cy="20" r="2" fill="#CBD5E1" />
                            <circle cx="30" cy="20" r="2" fill="#CBD5E1" />
                        </svg>
                    </div>
                    <p className={styles.emptyText}>{searchQuery ? 'Ничего не найдено' : 'Нет студентов'}</p>
                    <p className={styles.emptyHint}>
                        {searchQuery ? 'Попробуйте изменить запрос' : 'Зачислите первого студента в когорту'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className={styles.grid}>
                    {filtered.map((student) => {
                        const specColor = student.specialization_id ? getSpecColor(student.specialization_id) : '#94A3B8';
                        return (
                            <div key={student.student_id} className={styles.card} style={{ borderTopColor: specColor }}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.avatarWrapper}>
                                        {student.user.avatar ? (
                                            <img src={student.user.avatar} alt={fullName(student)} className={styles.avatar} />
                                        ) : (
                                            <div className={styles.avatarInitials} style={{ background: `${getAvatarColor(student.student_id)}20`, color: getAvatarColor(student.student_id) }}>
                                                {getInitials(student.user.name, student.user.surname)}
                                            </div>
                                        )}
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => setDeleteTarget(student)} title="Удалить из когорты">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                                <div className={styles.cardBody}>
                                    <h3 className={styles.cardName}>{fullName(student)}</h3>
                                    <p className={styles.cardMeta}>
                                        ID: {student.student_id}
                                        {student.user.isu_id && <> · ISU: {student.user.isu_id}</>}
                                    </p>
                                    <span
                                        className={styles.specBadge}
                                        style={{ background: `${specColor}14`, color: specColor, cursor: 'pointer' }}
                                        onClick={() => { setEditStudent(student); setEditSpecId(student.specialization_id); }}
                                        title="Нажмите, чтобы изменить специализацию"
                                    >
                                        {getSpecName(student.specialization_id)}
                                    </span>
                                </div>
                                <div className={styles.cardActions}>
                                    {student.user.email && (
                                        <button className={styles.actionBtn} onClick={() => window.open(`mailto:${student.user.email}`)}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M2.333 2.333h9.334c.645 0 1.166.522 1.166 1.167v7c0 .645-.521 1.167-1.166 1.167H2.333c-.645 0-1.167-.522-1.167-1.167v-7c0-.645.522-1.167 1.167-1.167z" stroke="currentColor" strokeWidth="1.2" />
                                                <path d="M12.833 3.5L7 7.583 1.167 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                            </svg>
                                            Email
                                        </button>
                                    )}
                                    {student.user.phone && (
                                        <button className={styles.actionBtn} onClick={() => window.open(`tel:${student.user.phone}`)}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M12.25 1.75L6.125 7.875M12.25 1.75L8.75 12.25l-2.625-4.375L1.75 5.25l10.5-3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Телефон
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.listView}>
                    <div className={styles.listHeader}>
                        <span className={styles.listColName}>Студент</span>
                        <span className={styles.listColSpec}>Специализация</span>
                        <span className={styles.listColEmail}>Email</span>
                        <span className={styles.listColActions}>Действия</span>
                    </div>
                    {filtered.map((student) => {
                        const specColor = student.specialization_id ? getSpecColor(student.specialization_id) : '#94A3B8';
                        return (
                            <div key={student.student_id} className={styles.listRow}>
                                <div className={styles.listColName}>
                                    <div className={styles.listAvatar} style={{ background: `${getAvatarColor(student.student_id)}20`, color: getAvatarColor(student.student_id) }}>
                                        {student.user.avatar ? (
                                            <img src={student.user.avatar} alt="" className={styles.listAvatarImg} />
                                        ) : getInitials(student.user.name, student.user.surname)}
                                    </div>
                                    <div>
                                        <div className={styles.listName}>{fullName(student)}</div>
                                        <div className={styles.listMeta}>ID: {student.student_id}{student.user.isu_id ? ` · ISU: ${student.user.isu_id}` : ''}</div>
                                    </div>
                                </div>
                                <div className={styles.listColSpec}>
                                    <span
                                        className={styles.specBadge}
                                        style={{ background: `${specColor}14`, color: specColor, cursor: 'pointer' }}
                                        onClick={() => { setEditStudent(student); setEditSpecId(student.specialization_id); }}
                                    >
                                        {getSpecName(student.specialization_id)}
                                    </span>
                                </div>
                                <div className={styles.listColEmail}>{student.user.email || '--'}</div>
                                <div className={styles.listColActions}>
                                    <button className={styles.deleteBtnSmall} onClick={() => setDeleteTarget(student)} title="Удалить">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination info ── */}
            {filtered.length > 0 && (
                <div className={styles.paginationInfo}>
                    Показано <strong>{filtered.length}</strong> из <strong>{students.length}</strong> студентов
                </div>
            )}

            {/* ── Add student modal (picker-style) ── */}
            {addModalOpen && (
                <div className={styles.modalBackdrop} onClick={() => { setAddModalOpen(false); setAddUserId(''); setAddSpecId(null); setAddError(''); }}>
                    <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.pickerHeader}>
                            <div className={styles.pickerHeaderIcon}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
                                    <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <path d="M15 7v6M12 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h3 className={styles.modalTitle}>Добавить студента</h3>
                            {selectedCohortLabel && (
                                <span className={styles.pickerBadge}>
                                    {selectedCohortLabel.cohort_year}/{selectedCohortLabel.cohort_year + 1}
                                </span>
                            )}
                            <button className={styles.modalCloseBtn} onClick={() => { setAddModalOpen(false); setAddUserId(''); setAddSpecId(null); setAddError(''); }}>
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
                                    type="number"
                                    placeholder="Введите User ID для зачисления..."
                                    value={addUserId}
                                    onChange={(e) => { setAddUserId(e.target.value); setAddError(''); }}
                                    autoFocus
                                    min={1}
                                />
                            </div>
                            {specializations.length > 0 && (
                                <div className={styles.pickerGroupFilter}>
                                    <span className={styles.pickerGroupLabel}>Специализация:</span>
                                    <button
                                        className={`${styles.pickerGroupBtn} ${!addSpecId ? styles.active : ''}`}
                                        onClick={() => setAddSpecId(null)}
                                    >
                                        Позже
                                    </button>
                                    {specializations.map((s) => (
                                        <button
                                            key={s.specialization_id}
                                            className={`${styles.pickerGroupBtn} ${addSpecId === s.specialization_id ? styles.active : ''}`}
                                            onClick={() => setAddSpecId(s.specialization_id)}
                                        >
                                            <span className={styles.pickerGroupDot} style={{ background: getSpecColor(s.specialization_id) }} />
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Enrolled students list */}
                        <div className={styles.pickerList}>
                            {students.length === 0 ? (
                                <div className={styles.pickerEmpty}>
                                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                        <circle cx="20" cy="20" r="18" stroke="#E2E8F0" strokeWidth="2" />
                                        <path d="M14 26c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                                        <circle cx="20" cy="16" r="4" stroke="#CBD5E1" strokeWidth="1.5" />
                                    </svg>
                                    <span>Пока нет зачисленных студентов</span>
                                </div>
                            ) : (
                                students.map((student) => {
                                    const specColor = student.specialization_id ? getSpecColor(student.specialization_id) : '#94A3B8';
                                    return (
                                        <div key={student.student_id} className={styles.pickerCard}>
                                            <div className={styles.pickerAvatar} style={{ background: `${getAvatarColor(student.student_id)}18`, color: getAvatarColor(student.student_id) }}>
                                                {getInitials(student.user.name, student.user.surname)}
                                            </div>
                                            <div className={styles.pickerInfo}>
                                                <span className={styles.pickerName}>{fullName(student)}</span>
                                                <span className={styles.pickerMeta}>
                                                    <span>ID: {student.student_id}</span>
                                                    <span className={styles.pickerDot} />
                                                    <span style={{ color: specColor }}>{getSpecName(student.specialization_id)}</span>
                                                    {student.user.email && (
                                                        <>
                                                            <span className={styles.pickerDot} />
                                                            <span>{student.user.email}</span>
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                            <span className={styles.pickerEnrolled}>зачислен</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {addError && (
                            <div className={styles.pickerError}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                {addError}
                            </div>
                        )}

                        <div className={styles.pickerFooter}>
                            <span className={styles.pickerFooterInfo}>
                                Зачислено: {students.length}
                            </span>
                            <div className={styles.pickerFooterActions}>
                                <button className={styles.btnCancel} onClick={() => { setAddModalOpen(false); setAddUserId(''); setAddSpecId(null); setAddError(''); }}>Отмена</button>
                                <button
                                    className={styles.btnPrimary}
                                    disabled={!addUserId.trim() || addLoading}
                                    onClick={handleAddStudent}
                                >
                                    {addLoading && <span className={styles.spinner} />}
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    Зачислить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit specialization modal ── */}
            <ModalDialog
                open={!!editStudent}
                title="Изменить специализацию"
                onClose={() => setEditStudent(null)}
                onOk={handleSaveSpecialization}
                okText="Сохранить"
                okLoading={editLoading}
            >
                {editStudent && (
                    <div className={styles.editModalContent}>
                        <div className={styles.editModalUser}>
                            <div
                                className={styles.editModalAvatar}
                                style={{ background: `${getAvatarColor(editStudent.student_id)}20`, color: getAvatarColor(editStudent.student_id) }}
                            >
                                {getInitials(editStudent.user.name, editStudent.user.surname)}
                            </div>
                            <div>
                                <div className={styles.editModalName}>{fullName(editStudent)}</div>
                                <div className={styles.editModalMeta}>ID: {editStudent.student_id}</div>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.fieldLabel}>Специализация</label>
                            <CustomSelect
                                width="100%"
                                value={editSpecId}
                                onChange={(val) => setEditSpecId(val)}
                                allowClear
                                onClear={() => setEditSpecId(null)}
                                placeholder="Без специализации"
                                options={specializations.map((s) => ({ value: s.specialization_id, label: s.name }))}
                            />
                        </div>
                    </div>
                )}
            </ModalDialog>

            {/* ── Delete confirm modal ── */}
            <ModalDialog
                open={!!deleteTarget}
                title="Удалить студента из когорты?"
                onClose={() => setDeleteTarget(null)}
                onOk={handleConfirmDelete}
                okText="Удалить"
                okDanger
                okLoading={deleteLoading}
            >
                {deleteTarget && (
                    <div className={styles.deleteModalContent}>
                        <div className={styles.deleteModalIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="1.5" />
                                <path d="M12 8v4M12 16v.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <p className={styles.deleteModalText}>
                            Студент <strong>{fullName(deleteTarget)}</strong> будет откреплён от когорты.
                            Это действие можно отменить, зачислив студента повторно.
                        </p>
                    </div>
                )}
            </ModalDialog>
        </div>
    );
};

export default StudentsJournalPage;
