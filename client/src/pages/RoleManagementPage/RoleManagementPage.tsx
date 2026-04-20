import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../components/Toast';
import { getUsers, getTags, updateUser } from '../../api/users';
import { createTeacher, deleteTeacher } from '../../api/teachers';
import { getFaculties } from '../../api/faculties';
import { getUserRole, type UserRoleInfo } from '../../contexts/AuthContext';
import type { UserWithRelations, TagBase, FacultyBase, TeacherRecord } from '../../api/types';
import styles from './RoleManagementPage.module.css';

/* ── Helpers ── */

const getInitials = (name: string, surname: string): string =>
    `${name?.charAt(0) || ''}${surname?.charAt(0) || ''}`.toUpperCase();

const AVATAR_COLORS = ['#FBBF24', '#F87171', '#A78BFA', '#FB923C', '#38BDF8', '#4ADE80', '#C084FC', '#F472B6'];
const getAvatarColor = (id: number): string => AVATAR_COLORS[id % AVATAR_COLORS.length];

const TAG_COLORS: Record<string, { color: string; bg: string }> = {
    'Администратор': { color: '#DC2626', bg: '#FEF2F2' },
    'Преподаватель': { color: '#16A34A', bg: '#F0FDF4' },
    'Студент': { color: '#2563EB', bg: '#EFF6FF' },
    'Менеджер': { color: '#D97706', bg: '#FFFBEB' },
    'Руководитель': { color: '#7C3AED', bg: '#F5F3FF' },
};
const getTagColor = (n: string) => TAG_COLORS[n] || { color: '#64748B', bg: '#F1F5F9' };

const fullName = (u: { surname: string; name: string; patronymic?: string | null }) =>
    [u.surname, u.name, u.patronymic].filter(Boolean).join(' ');

const toAuthUser = (u: UserWithRelations) => ({ ...u, tags: u.tags?.map(t => ({ tag_id: t.tag_id, name: t.name })) });
const getUserRoleInfo = (u: UserWithRelations): UserRoleInfo => getUserRole(toAuthUser(u));

const getUserStatus = (u: UserWithRelations): 'active' | 'inactive' =>
    (u.is_admin || u.student_data?.length > 0 || u.teacher_data?.length > 0 ||
     u.directed_cohorts?.length > 0 || u.managed_cohorts?.length > 0) ? 'active' : 'inactive';

const statusMap = {
    active: { label: 'Активен', dotColor: '#22C55E', textColor: '#16A34A', bg: '#F0FDF4' },
    inactive: { label: 'Неактивен', dotColor: '#94A3B8', textColor: '#64748B', bg: '#F8FAFC' },
};

/* ── Edit Modal ── */
const EditUserModal: React.FC<{
    open: boolean;
    user: UserWithRelations | null;
    allTags: TagBase[];
    faculties: FacultyBase[];
    onClose: () => void;
    onSaved: () => void;
}> = ({ open, user, allTags, faculties, onClose, onSaved }) => {
    const toast = useToast();
    const [tab, setTab] = useState<'roles' | 'tags'>('roles');
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    /* teacher form */
    const [showTeacherForm, setShowTeacherForm] = useState(false);
    const [teacherFacultyId, setTeacherFacultyId] = useState<number | null>(null);
    const teacherFormRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            setIsAdmin(user.is_admin ?? false);
            setSelectedTagIds(user.tags?.map(t => t.tag_id) || []);
            setShowTeacherForm(false);
            setTeacherFacultyId(null);
            setTab('roles');
        }
    }, [user]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open || !user) return null;

    const currentRole = getUserRoleInfo(user);
    const hasTeacher = (user.teacher_data?.length ?? 0) > 0;
    const activeTeachers = user.teacher_data?.filter((t: TeacherRecord) => !t.end_date) ?? [];
    const hasStudent = (user.student_data?.length ?? 0) > 0;
    const hasDirector = (user.directed_cohorts?.length ?? 0) > 0;
    const hasManager = (user.managed_cohorts?.length ?? 0) > 0;

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUser(user.user_id, { is_admin: isAdmin, tags_ids: selectedTagIds });
            toast.success(`Пользователь ${fullName(user)} обновлён`);
            onClose();
            onSaved();
        } catch {
            toast.error('Не удалось сохранить изменения');
        } finally {
            setSaving(false);
        }
    };

    const handleAddTeacher = async () => {
        if (!teacherFacultyId) return;
        setSaving(true);
        try {
            await createTeacher({
                user_id: user.user_id,
                faculty_id: teacherFacultyId,
                start_date: new Date().toISOString().split('T')[0],
            });
            toast.success('Преподаватель назначен');
            setShowTeacherForm(false);
            setTeacherFacultyId(null);
            onSaved();
            onClose();
        } catch {
            toast.error('Не удалось назначить преподавателем');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveTeacher = async (teacherId: number) => {
        setSaving(true);
        try {
            await deleteTeacher(teacherId);
            toast.success('Запись преподавателя удалена');
            onSaved();
            onClose();
        } catch {
            toast.error('Не удалось удалить запись преподавателя');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Управление пользователем</h3>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* User info */}
                    <div className={styles.modalUserInfo}>
                        <div className={styles.modalAvatar} style={{ background: getAvatarColor(user.user_id) }}>
                            {getInitials(user.name, user.surname)}
                        </div>
                        <div>
                            <div className={styles.modalUserName}>{fullName(user)}</div>
                            <div className={styles.modalUserEmail}>{user.email || `ID: ${user.user_id}`}</div>
                            <span className={styles.modalRoleBadge} style={{ color: currentRole.color, background: currentRole.bg }}>
                                {currentRole.label}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className={styles.modalTabs}>
                        <button className={`${styles.modalTab} ${tab === 'roles' ? styles.modalTabActive : ''}`} onClick={() => setTab('roles')}>
                            Роли
                        </button>
                        <button className={`${styles.modalTab} ${tab === 'tags' ? styles.modalTabActive : ''}`} onClick={() => setTab('tags')}>
                            Теги
                        </button>
                    </div>

                    {tab === 'roles' ? (
                        <>
                            {/* Admin toggle */}
                            <div className={styles.roleSection}>
                                <div className={styles.roleSectionHeader}>
                                    <span className={styles.roleSectionIcon} style={{ background: '#FEF2F2', color: '#DC2626' }}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 1.333l5.333 2.667v4c0 3.2-2.267 5.867-5.333 6.667C4.933 13.867 2.667 11.2 2.667 8V4L8 1.333z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <div className={styles.roleSectionTitle}>Администратор</div>
                                        <div className={styles.roleSectionDesc}>Полный доступ ко всем функциям системы</div>
                                    </div>
                                    <button
                                        className={`${styles.toggle} ${isAdmin ? styles.toggleActive : ''}`}
                                        onClick={() => setIsAdmin(v => !v)}
                                    >
                                        <span className={styles.toggleThumb} />
                                    </button>
                                </div>
                            </div>

                            {/* Teacher */}
                            <div className={styles.roleSection}>
                                <div className={styles.roleSectionHeader}>
                                    <span className={styles.roleSectionIcon} style={{ background: '#F0FDF4', color: '#16A34A' }}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 2L2 5l6 3 6-3-6-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                            <path d="M2 8l6 3 6-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div className={styles.roleSectionTitle}>Преподаватель</div>
                                        <div className={styles.roleSectionDesc}>
                                            {hasTeacher ? `${activeTeachers.length} активн. запис${activeTeachers.length === 1 ? 'ь' : 'ей'}` : 'Не назначен'}
                                        </div>
                                    </div>
                                    {!showTeacherForm && (
                                        <button className={styles.roleAddBtn} onClick={() => setShowTeacherForm(true)}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Active teacher records */}
                                {activeTeachers.map((t: TeacherRecord) => (
                                    <div key={t.teacher_id} className={styles.roleRecord}>
                                        <span className={styles.roleRecordDot} style={{ background: '#16A34A' }} />
                                        <span className={styles.roleRecordText}>
                                            С {new Date(t.start_date).toLocaleDateString('ru-RU')}
                                        </span>
                                        <button
                                            className={styles.roleRemoveBtn}
                                            onClick={() => handleRemoveTeacher(t.teacher_id)}
                                            disabled={saving}
                                            title="Удалить запись"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}

                                {/* Add teacher form */}
                                {showTeacherForm && (
                                    <div className={styles.roleForm} ref={teacherFormRef}>
                                        <select
                                            className={styles.roleFormSelect}
                                            value={teacherFacultyId ?? ''}
                                            onChange={e => setTeacherFacultyId(Number(e.target.value) || null)}
                                        >
                                            <option value="">Выберите факультет...</option>
                                            {faculties.map(f => (
                                                <option key={f.faculty_id} value={f.faculty_id}>
                                                    {f.short_name ? `${f.short_name} — ${f.name}` : f.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className={styles.roleFormActions}>
                                            <button className={styles.roleFormConfirm} onClick={handleAddTeacher} disabled={!teacherFacultyId || saving}>
                                                Назначить
                                            </button>
                                            <button className={styles.roleFormCancel} onClick={() => { setShowTeacherForm(false); setTeacherFacultyId(null); }}>
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Student (read-only) */}
                            <div className={styles.roleSection}>
                                <div className={styles.roleSectionHeader}>
                                    <span className={styles.roleSectionIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                                            <path d="M3 13.5c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <div className={styles.roleSectionTitle}>Студент</div>
                                        <div className={styles.roleSectionDesc}>
                                            {hasStudent
                                                ? `${user.student_data.length} запис${user.student_data.length === 1 ? 'ь' : 'ей'}`
                                                : 'Не зачислен'}
                                        </div>
                                    </div>
                                    <span className={styles.roleHint}>через журнал студентов</span>
                                </div>
                                {user.student_data?.map(s => (
                                    <div key={s.student_id} className={styles.roleRecord}>
                                        <span className={styles.roleRecordDot} style={{ background: '#2563EB' }} />
                                        <span className={styles.roleRecordText}>
                                            {s.cohort?.program?.name || 'Программа'} · {s.cohort?.cohort_year}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Director / Manager (read-only) */}
                            <div className={styles.roleSection}>
                                <div className={styles.roleSectionHeader}>
                                    <span className={styles.roleSectionIcon} style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                            <path d="M5.5 7h5M5.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <div className={styles.roleSectionTitle}>Руководитель / Менеджер ОП</div>
                                        <div className={styles.roleSectionDesc}>
                                            {hasDirector || hasManager
                                                ? `${(user.directed_cohorts?.length || 0) + (user.managed_cohorts?.length || 0)} когорт`
                                                : 'Не назначен'}
                                        </div>
                                    </div>
                                    <span className={styles.roleHint}>через когорты</span>
                                </div>
                                {user.directed_cohorts?.map(c => (
                                    <div key={`dir-${c.cohort_id}`} className={styles.roleRecord}>
                                        <span className={styles.roleRecordDot} style={{ background: '#7C3AED' }} />
                                        <span className={styles.roleRecordText}>
                                            Руководитель · {c.program?.name} · {c.cohort_year}
                                        </span>
                                    </div>
                                ))}
                                {user.managed_cohorts?.map(c => (
                                    <div key={`mgr-${c.cohort_id}`} className={styles.roleRecord}>
                                        <span className={styles.roleRecordDot} style={{ background: '#D97706' }} />
                                        <span className={styles.roleRecordText}>
                                            Менеджер · {c.program?.name} · {c.cohort_year}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        /* Tags tab */
                        <div className={styles.roleList}>
                            {allTags.map(tag => {
                                const isActive = selectedTagIds.includes(tag.tag_id);
                                const colors = getTagColor(tag.name);
                                return (
                                    <button
                                        key={tag.tag_id}
                                        className={`${styles.roleOption} ${isActive ? styles.roleOptionActive : ''}`}
                                        style={isActive ? { borderColor: `${colors.color}60`, background: colors.bg } : undefined}
                                        onClick={() => setSelectedTagIds(prev =>
                                            prev.includes(tag.tag_id) ? prev.filter(id => id !== tag.tag_id) : [...prev, tag.tag_id]
                                        )}
                                    >
                                        <span
                                            className={styles.roleCheck}
                                            style={isActive ? { background: colors.color, borderColor: colors.color } : undefined}
                                        >
                                            {isActive && (
                                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </span>
                                        <span style={{ color: isActive ? colors.color : 'var(--text-secondary)' }}>{tag.name}</span>
                                    </button>
                                );
                            })}
                            {allTags.length === 0 && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Нет доступных тегов</p>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.modalBtnCancel} onClick={onClose}>Отмена</button>
                    <button className={styles.modalBtnSave} onClick={handleSave} disabled={saving}>
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════ */

const RoleManagementPage: React.FC = () => {
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [users, setUsers] = useState<UserWithRelations[]>([]);
    const [allTags, setAllTags] = useState<TagBase[]>([]);
    const [faculties, setFaculties] = useState<FacultyBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [editUser, setEditUser] = useState<UserWithRelations | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const loadData = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const [usersData, tagsData, facultiesData] = await Promise.all([getUsers(), getTags(), getFaculties()]);
            if (signal?.aborted) return;
            setUsers(usersData);
            setAllTags(tagsData);
            setFaculties(facultiesData);
        } catch {
            if (signal?.aborted) return;
            toast.error('Не удалось загрузить данные');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const ac = new AbortController();
        loadData(ac.signal);
        return () => ac.abort();
    }, [loadData]);

    const filteredUsers = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return fullName(u).toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            String(u.user_id).includes(q);
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        switch (sortBy) {
            case 'name-asc': return fullName(a).localeCompare(fullName(b), 'ru');
            case 'name-desc': return fullName(b).localeCompare(fullName(a), 'ru');
            case 'role': return getUserRoleInfo(a).label.localeCompare(getUserRoleInfo(b).label, 'ru');
            default: return 0;
        }
    });

    const totalPages = Math.ceil(sortedUsers.length / pageSize);
    const paginatedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <h1>Управление пользователями</h1>
                    <p>Роли, теги и доступ пользователей системы.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                    <button className={styles.btnOutline} onClick={() => loadData()} disabled={loading}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 8a6 6 0 0111.46-2.46M14 8A6 6 0 012.54 10.46" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            <path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Обновить
                    </button>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Поиск по ФИО, Email или ID..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className={styles.toolbarRight}>
                        <span className={styles.sortLabel}>Сортировать по:</span>
                        <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="name-asc">ФИО (А-Я)</option>
                            <option value="name-desc">ФИО (Я-А)</option>
                            <option value="role">Роль</option>
                        </select>
                    </div>
                </div>

                <div className={styles.listHeader}>
                    <span>ФИО</span>
                    <span>РОЛЬ</span>
                    <span>ТЕГИ</span>
                    <span>СТАТУС</span>
                    <span>ДЕЙСТВИЕ</span>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Загрузка...</div>
                ) : paginatedUsers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {searchQuery ? 'Ничего не найдено' : 'Нет пользователей'}
                    </div>
                ) : (
                    <div>
                        {paginatedUsers.map(user => {
                            const status = statusMap[getUserStatus(user)];
                            const roleInfo = getUserRoleInfo(user);
                            return (
                                <div key={user.user_id} className={styles.userRow}>
                                    <div className={styles.colName}>
                                        <div className={styles.avatar} style={{ background: getAvatarColor(user.user_id) }}>
                                            {getInitials(user.name, user.surname)}
                                        </div>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{fullName(user)}</span>
                                            <span className={styles.userEmail}>{user.email || `ID: ${user.user_id}`}</span>
                                        </div>
                                    </div>
                                    <div className={styles.colRole}>
                                        <span className={styles.roleBadge} style={{ color: roleInfo.color, background: roleInfo.bg, borderColor: `${roleInfo.color}30` }}>
                                            {roleInfo.label}
                                        </span>
                                    </div>
                                    <div className={styles.colDept}>
                                        {user.tags && user.tags.length > 0 ? user.tags.map(tag => {
                                            const c = getTagColor(tag.name);
                                            return <span key={tag.tag_id} className={styles.tagBadge} style={{ color: c.color, background: c.bg }}>{tag.name}</span>;
                                        }) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                                    </div>
                                    <div className={styles.colStatus}>
                                        <span className={styles.statusBadge} style={{ color: status.textColor, background: status.bg }}>
                                            <span className={styles.statusDot} style={{ background: status.dotColor }} />
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className={styles.colAction}>
                                        <button className={styles.editBtn} onClick={() => setEditUser(user)}>
                                            Редактировать
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M5.25 2.333h-2.333A1.167 1.167 0 001.75 3.5v7A1.167 1.167 0 002.917 11.667h7A1.167 1.167 0 0011.083 10.5V8.167" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                                <path d="M10.208 1.458a1.237 1.237 0 011.75 1.75L7 8.167l-2.333.583.583-2.333 4.958-4.959z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className={styles.tablePagination}>
                        <span className={styles.paginationInfo}>
                            Показано с <strong>{(page - 1) * pageSize + 1}</strong> по <strong>{Math.min(page * pageSize, sortedUsers.length)}</strong> из <strong>{sortedUsers.length}</strong>
                        </span>
                        <div className={styles.paginationControls}>
                            <button className={styles.paginationBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let n: number;
                                if (totalPages <= 5) n = i + 1;
                                else if (page <= 3) n = i + 1;
                                else if (page >= totalPages - 2) n = totalPages - 4 + i;
                                else n = page - 2 + i;
                                return <button key={n} className={`${styles.paginationBtn} ${page === n ? styles.active : ''}`} onClick={() => setPage(n)}>{n}</button>;
                            })}
                            <button className={styles.paginationBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <EditUserModal
                open={!!editUser}
                user={editUser}
                allTags={allTags}
                faculties={faculties}
                onClose={() => setEditUser(null)}
                onSaved={() => loadData()}
            />
        </div>
    );
};

export default RoleManagementPage;
