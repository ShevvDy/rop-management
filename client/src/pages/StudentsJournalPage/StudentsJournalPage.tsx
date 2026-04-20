import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../components/Toast';
import { getPrograms, getProgram } from '../../api/programs';
import { getCohortStudents, updateCohortStudents } from '../../api/cohorts';
import { createStudent, deleteStudent } from '../../api/students';
import { getUsers } from '../../api/users';
import { createSpecialization, deleteSpecialization } from '../../api/specializations';
import type {
    ProgramResponse,
    ProgramWithRelations,
    CohortInProgram,
    StudentBase,
    Specialization,
    UserWithRelations,
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
    const [addSpecId, setAddSpecId] = useState<number | null>(null);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [allUsers, setAllUsers] = useState<UserWithRelations[]>([]);
    const [allUsersLoading, setAllUsersLoading] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [addSearch, setAddSearch] = useState('');

    /* ── Specialization management ── */
    const [showAddSpec, setShowAddSpec] = useState(false);
    const [newSpecName, setNewSpecName] = useState('');
    const [addSpecLoading, setAddSpecLoading] = useState(false);

    /* ── Edit specialization modal ── */
    const [editStudent, setEditStudent] = useState<StudentBase | null>(null);
    const [editSpecId, setEditSpecId] = useState<number | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    /* ── Delete confirm modal ── */
    const [deleteTarget, setDeleteTarget] = useState<StudentBase | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    /* ── Load programs on mount ── */
    useEffect(() => {
        let cancelled = false;
        getPrograms().then((progs) => {
            if (cancelled) return;
            setPrograms(progs);
            if (progs.length > 0) setSelectedProgramId(progs[0].program_id);
        }).catch(() => { if (!cancelled) toast.error('Не удалось загрузить программы'); });
        return () => { cancelled = true; };
    }, []);

    /* ── Load cohorts when program changes ── */
    useEffect(() => {
        if (!selectedProgramId) return;
        let cancelled = false;
        setCohorts([]);
        setSelectedCohortId(null);
        setStudents([]);
        getProgram(selectedProgramId).then((prog: ProgramWithRelations) => {
            if (cancelled) return;
            setCohorts(prog.cohorts || []);
            if (prog.cohorts?.length > 0) {
                setSelectedCohortId(prog.cohorts[0].cohort_id);
            }
        }).catch(() => { if (!cancelled) toast.error('Не удалось загрузить когорты'); });
        return () => { cancelled = true; };
    }, [selectedProgramId]);

    /* ── Load students when cohort changes ── */
    const loadStudents = useCallback(async (cancelled?: { current: boolean }) => {
        if (!selectedCohortId) return;
        setLoading(true);
        try {
            const resp = await getCohortStudents(selectedCohortId);
            if (cancelled?.current) return;
            setStudents(resp.students ?? []);
            setSpecializations(resp.specializations ?? []);
        } catch {
            if (cancelled?.current) return;
            setStudents([]);
            setSpecializations([]);
        } finally {
            if (!cancelled?.current) setLoading(false);
        }
    }, [selectedCohortId]);

    useEffect(() => {
        const cancelled = { current: false };
        loadStudents(cancelled);
        return () => { cancelled.current = true; };
    }, [loadStudents]);

    /* ── Filtered students ── */
    const filtered = students.filter((s) => {
        if (activeSpecId !== 'all') {
            if (activeSpecId === 0) {
                if (s.specialization_id) return false;
            } else if (s.specialization_id !== activeSpecId) {
                return false;
            }
        }
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

    /* ── Open add modal: load users ── */
    const openAddModal = async () => {
        setAddModalOpen(true);
        setSelectedUserIds(new Set());
        setAddSpecId(null);
        setAddSearch('');
        setAddError('');
        setAllUsersLoading(true);
        try {
            const users = await getUsers();
            setAllUsers(users);
        } catch {
            setAllUsers([]);
        } finally {
            setAllUsersLoading(false);
        }
    };

    const toggleUserSelection = (userId: number) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId); else next.add(userId);
            return next;
        });
    };

    const selectAllFiltered = (filteredIds: number[]) => {
        setSelectedUserIds(prev => {
            const allSelected = filteredIds.every(id => prev.has(id));
            const next = new Set(prev);
            if (allSelected) {
                filteredIds.forEach(id => next.delete(id));
            } else {
                filteredIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    /* ── Handlers ── */
    const handleAddStudents = async () => {
        if (selectedUserIds.size === 0 || !selectedCohortId) return;
        setAddError('');
        setAddLoading(true);

        /* Compute dates from cohort year */
        const cohort = cohorts.find(c => c.cohort_id === selectedCohortId);
        const year = cohort?.cohort_year ?? new Date().getFullYear();
        const startDate = `${year}-09-01`;
        const endDate = `${year + 4}-06-30`;

        let successCount = 0;
        let failCount = 0;
        const newStudentIds: number[] = [];
        for (const userId of selectedUserIds) {
            try {
                const newStudent = await createStudent({
                    user_id: userId,
                    cohort_id: selectedCohortId,
                    start_date: startDate,
                    end_date: endDate,
                });
                if (newStudent?.student_id) newStudentIds.push(newStudent.student_id);
                successCount++;
            } catch {
                failCount++;
            }
        }
        /* Assign specialization if selected */
        if (addSpecId && newStudentIds.length > 0) {
            try {
                await updateCohortStudents(selectedCohortId,
                    newStudentIds.map(sid => ({ student_id: sid, specialization_id: addSpecId }))
                );
            } catch { /* не критично */ }
        }
        if (successCount > 0) {
            toast.success(`Зачислено: ${successCount}${failCount > 0 ? `, ошибок: ${failCount}` : ''}`);
            loadStudents();
        }
        if (failCount > 0 && successCount === 0) {
            setAddError(`Не удалось зачислить ${failCount} пользователей. Возможно, они уже зачислены.`);
            setAddLoading(false);
            return;
        }
        setAddModalOpen(false);
        setSelectedUserIds(new Set());
        setAddSpecId(null);
        setAddLoading(false);
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

    const handleAddSpecialization = async () => {
        if (!newSpecName.trim() || !selectedCohortId) return;
        setAddSpecLoading(true);
        try {
            const newSpec = await createSpecialization({ name: newSpecName.trim(), cohort_id: selectedCohortId });
            setSpecializations(prev => [...prev, newSpec]);
            setNewSpecName('');
            setShowAddSpec(false);
            toast.success(`Специализация "${newSpec.name}" создана`);
        } catch {
            toast.error('Не удалось создать специализацию');
        } finally {
            setAddSpecLoading(false);
        }
    };

    const [deleteSpecTarget, setDeleteSpecTarget] = useState<Specialization | null>(null);
    const [deleteSpecLoading, setDeleteSpecLoading] = useState(false);

    const handleDeleteSpecialization = (specId: number) => {
        const spec = specializations.find(s => s.specialization_id === specId);
        if (spec) setDeleteSpecTarget(spec);
    };

    const executeDeleteSpec = async () => {
        if (!deleteSpecTarget) return;
        setDeleteSpecLoading(true);
        try {
            await deleteSpecialization(deleteSpecTarget.specialization_id);
            setSpecializations(prev => prev.filter(s => s.specialization_id !== deleteSpecTarget.specialization_id));
            if (activeSpecId === deleteSpecTarget.specialization_id) setActiveSpecId('all');
            toast.success('Специализация удалена');
            setDeleteSpecTarget(null);
            loadStudents();
        } catch {
            toast.error('Не удалось удалить специализацию');
        } finally {
            setDeleteSpecLoading(false);
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
                    <button className={styles.btnAdd} onClick={openAddModal} disabled={!selectedCohortId}>
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
            {selectedCohortId && (
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
                                <span
                                    className={styles.tabDelete}
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSpecialization(spec.specialization_id); }}
                                    title="Удалить специализацию"
                                >
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                    </svg>
                                </span>
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

                    {/* Add specialization */}
                    {showAddSpec ? (
                        <div className={styles.tabAddForm}>
                            <input
                                className={styles.tabAddInput}
                                value={newSpecName}
                                onChange={(e) => setNewSpecName(e.target.value)}
                                placeholder="Название..."
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSpecialization(); if (e.key === 'Escape') { setShowAddSpec(false); setNewSpecName(''); } }}
                            />
                            <button
                                className={styles.tabAddConfirm}
                                onClick={handleAddSpecialization}
                                disabled={!newSpecName.trim() || addSpecLoading}
                            >
                                {addSpecLoading ? '...' : ''}
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button className={styles.tabAddCancel} onClick={() => { setShowAddSpec(false); setNewSpecName(''); }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button className={styles.tabAddBtn} onClick={() => setShowAddSpec(true)} title="Добавить специализацию">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
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

            {/* ── Add students modal (multi-select picker) ── */}
            {addModalOpen && (() => {
                const enrolledUserIds = new Set(students.map(s => s.user.user_id));
                const availableUsers = allUsers.filter(u => {
                    if (enrolledUserIds.has(u.user_id)) return false;
                    if (!addSearch) return true;
                    const q = addSearch.toLowerCase();
                    const name = [u.surname, u.name, u.patronymic].filter(Boolean).join(' ').toLowerCase();
                    return name.includes(q) || (u.email || '').toLowerCase().includes(q) || String(u.user_id).includes(q);
                });
                const filteredIds = availableUsers.map(u => u.user_id);
                const allChecked = filteredIds.length > 0 && filteredIds.every(id => selectedUserIds.has(id));

                return (
                    <div className={styles.modalBackdrop} onClick={() => setAddModalOpen(false)}>
                        <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.pickerHeader}>
                                <div className={styles.pickerHeaderIcon}>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
                                        <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                        <path d="M15 7v6M12 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <h3 className={styles.modalTitle}>Зачислить студентов</h3>
                                {selectedCohortLabel && (
                                    <span className={styles.pickerBadge}>
                                        {selectedCohortLabel.cohort_year}/{selectedCohortLabel.cohort_year + 1}
                                    </span>
                                )}
                                {selectedUserIds.size > 0 && (
                                    <span className={styles.pickerBadge} style={{ background: 'var(--primary)', color: '#fff' }}>
                                        {selectedUserIds.size} выбр.
                                    </span>
                                )}
                                <button className={styles.modalCloseBtn} onClick={() => setAddModalOpen(false)}>
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
                                        placeholder="Поиск по ФИО, email или ID..."
                                        value={addSearch}
                                        onChange={(e) => setAddSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                {specializations.length > 0 && (
                                    <div className={styles.pickerGroupFilter}>
                                        <span className={styles.pickerGroupLabel}>Специализация при зачислении:</span>
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

                            <div className={styles.pickerList}>
                                {allUsersLoading ? (
                                    <div className={styles.pickerEmpty}>
                                        <span className={styles.spinner} />
                                        <span>Загрузка пользователей...</span>
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div className={styles.pickerEmpty}>
                                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                            <circle cx="20" cy="20" r="18" stroke="#E2E8F0" strokeWidth="2" />
                                            <path d="M14 26c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                                            <circle cx="20" cy="16" r="4" stroke="#CBD5E1" strokeWidth="1.5" />
                                        </svg>
                                        <span>{addSearch ? 'Ничего не найдено' : 'Все пользователи уже зачислены'}</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Select all */}
                                        <div
                                            className={`${styles.pickerCard} ${allChecked ? styles.pickerCardSelected : ''}`}
                                            onClick={() => selectAllFiltered(filteredIds)}
                                            style={{ borderBottom: '1px solid var(--border)', background: allChecked ? 'var(--primary-light)' : '#F8FAFC' }}
                                        >
                                            <div className={styles.pickerCheckbox}>
                                                {allChecked ? (
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                        <rect x="1" y="1" width="16" height="16" rx="4" fill="var(--primary)" stroke="var(--primary)" strokeWidth="1.5" />
                                                        <path d="M5 9l2.5 2.5L13 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                ) : (
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                        <rect x="1" y="1" width="16" height="16" rx="4" stroke="#CBD5E1" strokeWidth="1.5" />
                                                        <path d="M5 9h8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                Выбрать всех ({availableUsers.length})
                                            </span>
                                        </div>

                                        {availableUsers.map((user) => {
                                            const isSelected = selectedUserIds.has(user.user_id);
                                            return (
                                                <div
                                                    key={user.user_id}
                                                    className={`${styles.pickerCard} ${isSelected ? styles.pickerCardSelected : ''}`}
                                                    onClick={() => toggleUserSelection(user.user_id)}
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
                                                    <div className={styles.pickerAvatar} style={{ background: `${getAvatarColor(user.user_id)}18`, color: getAvatarColor(user.user_id) }}>
                                                        {getInitials(user.name, user.surname)}
                                                    </div>
                                                    <div className={styles.pickerInfo}>
                                                        <span className={styles.pickerName}>
                                                            {[user.surname, user.name, user.patronymic].filter(Boolean).join(' ')}
                                                        </span>
                                                        <span className={styles.pickerMeta}>
                                                            <span>ID: {user.user_id}</span>
                                                            {user.email && (
                                                                <>
                                                                    <span className={styles.pickerDot} />
                                                                    <span>{user.email}</span>
                                                                </>
                                                            )}
                                                            {user.isu_id && (
                                                                <>
                                                                    <span className={styles.pickerDot} />
                                                                    <span>ISU: {user.isu_id}</span>
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
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
                                    Доступно: {availableUsers.length} · Зачислено: {students.length}
                                </span>
                                <div className={styles.pickerFooterActions}>
                                    <button className={styles.btnCancel} onClick={() => setAddModalOpen(false)}>Отмена</button>
                                    <button
                                        className={styles.btnPrimary}
                                        disabled={selectedUserIds.size === 0 || addLoading}
                                        onClick={handleAddStudents}
                                    >
                                        {addLoading && <span className={styles.spinner} />}
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        </svg>
                                        Зачислить{selectedUserIds.size > 0 ? ` (${selectedUserIds.size})` : ''}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

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

            {/* ── Delete specialization confirm ── */}
            <ModalDialog
                open={!!deleteSpecTarget}
                title="Удалить специализацию?"
                onClose={() => setDeleteSpecTarget(null)}
                onOk={executeDeleteSpec}
                okText="Удалить"
                okDanger
                okLoading={deleteSpecLoading}
            >
                {deleteSpecTarget && (
                    <div className={styles.deleteModalContent}>
                        <div className={styles.deleteModalIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="1.5" />
                                <path d="M12 8v4M12 16v.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <p className={styles.deleteModalText}>
                            Специализация <strong>{deleteSpecTarget.name}</strong> будет удалена.
                            {students.filter(s => s.specialization_id === deleteSpecTarget.specialization_id).length > 0 && (
                                <> {students.filter(s => s.specialization_id === deleteSpecTarget.specialization_id).length} студентов будут откреплены.</>
                            )}
                        </p>
                    </div>
                )}
            </ModalDialog>
        </div>
    );
};

export default StudentsJournalPage;
