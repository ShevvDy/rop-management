import React, { useState } from 'react';
import styles from './RoleManagementPage.module.css';

interface UserRole {
    label: string;
    color: string;
    bg: string;
}

interface UserRecord {
    id: string;
    initials: string;
    avatarBg: string;
    name: string;
    email: string;
    roles: UserRole[];
    department: string;
    departmentSub: string;
    status: 'active' | 'vacation' | 'inactive';
}

const statusMap: Record<string, { label: string; dotColor: string; textColor: string; bg: string }> = {
    active: { label: 'Активен', dotColor: '#22C55E', textColor: '#16A34A', bg: '#F0FDF4' },
    vacation: { label: 'В отпуске', dotColor: '#F59E0B', textColor: '#D97706', bg: '#FFFBEB' },
    inactive: { label: 'Неактивен', dotColor: '#94A3B8', textColor: '#64748B', bg: '#F8FAFC' },
};

const roleColors: Record<string, { color: string; bg: string }> = {
    professor: { color: '#16A34A', bg: '#F0FDF4' },
    editor: { color: '#2563EB', bg: '#EFF6FF' },
    student: { color: '#64748B', bg: '#F1F5F9' },
    admin: { color: '#DC2626', bg: '#FEF2F2' },
    starosta: { color: '#D97706', bg: '#FFFBEB' },
};

const users: UserRecord[] = [
    { id: '1', initials: 'СМ', avatarBg: '#FBBF24', name: 'Д-р Сара Миллер', email: 's.miller@univ.edu', roles: [{ label: 'Профессор', ...roleColors.professor }, { label: 'Редактор', ...roleColors.editor }], department: 'Факультет наук', departmentSub: 'Биология, Генетика', status: 'active' },
    { id: '2', initials: 'ДЧ', avatarBg: '#F87171', name: 'Джеймс Чен', email: 'j.chen@student.univ.edu', roles: [{ label: 'Студент', ...roleColors.student }], department: 'Инженерный корпус', departmentSub: 'Компьютерные науки', status: 'active' },
    { id: '3', initials: 'ЕК', avatarBg: '#A78BFA', name: 'Елена Козлова', email: 'e.kozlova@admin.univ.edu', roles: [{ label: 'Администратор', ...roleColors.admin }], department: 'Администрация', departmentSub: 'Управление персоналом', status: 'active' },
    { id: '4', initials: 'АП', avatarBg: '#FB923C', name: 'Алексей Петров', email: 'a.petrov@student.univ.edu', roles: [{ label: 'Студент', ...roleColors.student }, { label: 'Староста', ...roleColors.starosta }], department: 'Экономический', departmentSub: 'Финансы', status: 'vacation' },
    { id: '5', initials: 'ОС', avatarBg: '#38BDF8', name: 'Ольга Сидорова', email: 'o.sidorova@univ.edu', roles: [{ label: 'Профессор', ...roleColors.professor }], department: 'Факультет наук', departmentSub: 'Физика', status: 'active' },
    { id: '6', initials: 'МВ', avatarBg: '#4ADE80', name: 'Максим Волков', email: 'm.volkov@student.univ.edu', roles: [{ label: 'Студент', ...roleColors.student }], department: 'Инженерный корпус', departmentSub: 'Информатика', status: 'active' },
    { id: '7', initials: 'НА', avatarBg: '#C084FC', name: 'Наталья Андреева', email: 'n.andreeva@admin.univ.edu', roles: [{ label: 'Администратор', ...roleColors.admin }, { label: 'Редактор', ...roleColors.editor }], department: 'Администрация', departmentSub: 'ИТ Отдел', status: 'active' },
    { id: '8', initials: 'ИК', avatarBg: '#F472B6', name: 'Иван Кузнецов', email: 'i.kuznetsov@univ.edu', roles: [{ label: 'Профессор', ...roleColors.professor }], department: 'Факультет наук', departmentSub: 'Математика', status: 'inactive' },
];

const RoleManagementPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <h1>Все пользователи</h1>
                    <p>Просмотр и редактирование ролей доступа для сотрудников и студентов.</p>
                </div>
                <div className={styles.pageHeaderRight}>
                    <button className={styles.btnOutline}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M14 10v3.333c0 .368-.298.667-.667.667H2.667A.667.667 0 012 13.333V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            <path d="M5.333 7.333L8 10l2.667-2.667M8 10V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Экспорт CSV
                    </button>
                    <button className={styles.btnPrimary}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="6" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M12 14c0-2.21-1.79-4-4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            <path d="M12 5v4M10 7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        Добавить пользователя
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className={styles.toolbarRight}>
                        <span className={styles.sortLabel}>Сортировать по:</span>
                        <select
                            className={styles.sortSelect}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name-asc">ФИО (А-Я)</option>
                            <option value="name-desc">ФИО (Я-А)</option>
                            <option value="role">Роль</option>
                            <option value="department">Отдел</option>
                        </select>
                    </div>
                </div>

                <div className={styles.listHeader}>
                    <span>ФИО</span>
                    <span>ТЕКУЩАЯ РОЛЬ</span>
                    <span>НАВЫКИ / ОТДЕЛ</span>
                    <span>СТАТУС</span>
                    <span>ДЕЙСТВИЕ</span>
                </div>

                <div>
                    {filteredUsers.map((user) => {
                        const status = statusMap[user.status];
                        return (
                            <div key={user.id} className={styles.userRow}>
                                <div className={styles.colName}>
                                    <div className={styles.avatar} style={{ background: user.avatarBg }}>
                                        {user.initials}
                                    </div>
                                    <div className={styles.userInfo}>
                                        <span className={styles.userName}>{user.name}</span>
                                        <span className={styles.userEmail}>{user.email}</span>
                                    </div>
                                </div>

                                <div className={styles.colRole}>
                                    {user.roles.map((role, i) => (
                                        <span
                                            key={i}
                                            className={styles.roleBadge}
                                            style={{ color: role.color, background: role.bg, borderColor: `${role.color}30` }}
                                        >
                                            {role.label}
                                        </span>
                                    ))}
                                </div>

                                <div className={styles.colDept}>
                                    <span className={styles.deptName}>{user.department}</span>
                                    <span className={styles.deptSub}>{user.departmentSub}</span>
                                </div>

                                <div className={styles.colStatus}>
                                    <span className={styles.statusBadge} style={{ color: status.textColor, background: status.bg }}>
                                        <span className={styles.statusDot} style={{ background: status.dotColor }} />
                                        {status.label}
                                    </span>
                                </div>

                                <div className={styles.colAction}>
                                    <button className={styles.editBtn}>
                                        Изменить роль
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

                <div className={styles.tablePagination}>
                    <span className={styles.paginationInfo}>
                        Показано с <strong>1</strong> по <strong>10</strong> из <strong>248</strong> пользователей
                    </span>
                    <div className={styles.paginationControls}>
                        <button className={styles.paginationBtn} disabled>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button className={`${styles.paginationBtn} ${styles.active}`}>1</button>
                        <button className={styles.paginationBtn}>2</button>
                        <button className={styles.paginationBtn}>3</button>
                        <span className={styles.paginationEllipsis}>…</span>
                        <button className={styles.paginationBtn}>8</button>
                        <button className={styles.paginationBtn}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.pageFooter}>
                © 2024 University Data Management Systems. Все права защищены.
            </div>
        </div>
    );
};

export default RoleManagementPage;
