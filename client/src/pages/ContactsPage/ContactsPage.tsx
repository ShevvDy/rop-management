import React, { useState } from 'react';
import styles from './ContactsPage.module.css';

interface Contact {
    id: string;
    name: string;
    studentId: string;
    group: string;
    groupColor: string;
    level: string;
    levelColor: string;
    course: number;
    skills: string[];
    avatar: string | null;
    initials: string;
    avatarBg: string;
    status: 'online' | 'idle' | 'offline';
    borderColor: string;
}

const contacts: Contact[] = [
    {
        id: '1',
        name: 'Анна Смирнова',
        studentId: '2490123',
        group: 'ИВТ-302',
        groupColor: '#135BEC',
        level: 'Бакалавриат • 3 курс',
        levelColor: '#135BEC',
        course: 3,
        skills: ['Java', 'SQL', 'Git'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna&backgroundColor=ffd5dc',
        initials: 'АС',
        avatarBg: '#FFE0E6',
        status: 'online',
        borderColor: '#135BEC',
    },
    {
        id: '2',
        name: 'Дмитрий Волков',
        studentId: '2490155',
        group: 'М-ИИ-101',
        groupColor: '#8B5CF6',
        level: 'Магистратура • 1 курс',
        levelColor: '#8B5CF6',
        course: 1,
        skills: ['Python', 'ML', 'PyTorch'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry&backgroundColor=c0aede',
        initials: 'ДВ',
        avatarBg: '#E0D4F5',
        status: 'idle',
        borderColor: '#8B5CF6',
    },
    {
        id: '3',
        name: 'Елена Козлова',
        studentId: '2490333',
        group: 'ЭК-201',
        groupColor: '#10B981',
        level: 'Бакалавриат • 2 курс',
        levelColor: '#135BEC',
        course: 2,
        skills: ['Economics', 'Excel', 'Analysis'],
        avatar: null,
        initials: 'ЕК',
        avatarBg: '#E0E7FF',
        status: 'online',
        borderColor: '#10B981',
    },
    {
        id: '4',
        name: 'София Андреева',
        studentId: '2490892',
        group: 'Д-405',
        groupColor: '#F59E0B',
        level: 'Бакалавриат • 4 курс',
        levelColor: '#EF4444',
        course: 4,
        skills: ['UI/UX', 'Figma', 'Design'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&backgroundColor=ffd5dc',
        initials: 'СА',
        avatarBg: '#FFE0E6',
        status: 'idle',
        borderColor: '#F59E0B',
    },
    {
        id: '5',
        name: 'Максим Соколов',
        studentId: '2490512',
        group: 'ИВТ-102',
        groupColor: '#135BEC',
        level: 'Бакалавриат • 1 курс',
        levelColor: '#135BEC',
        course: 1,
        skills: ['C++', 'Algorithms'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maxim&backgroundColor=b6e3f4',
        initials: 'МС',
        avatarBg: '#D0E8FF',
        status: 'online',
        borderColor: '#135BEC',
    },
    {
        id: '6',
        name: 'Новый Студент',
        studentId: '—',
        group: '—',
        groupColor: '#94A3B8',
        level: 'Не распределен',
        levelColor: '#94A3B8',
        course: 0,
        skills: [],
        avatar: null,
        initials: '',
        avatarBg: '#F1F5F9',
        status: 'offline',
        borderColor: '#E2E8F0',
    },
];

const tabs = [
    { key: 'students', label: 'Студенты', count: 842, icon: '🎓' },
    { key: 'teachers', label: 'Преподаватели', count: 126, icon: '📋' },
    { key: 'admins', label: 'Админ. состав', count: 48, icon: '⚙️' },
    { key: 'contractors', label: 'Контрагенты', count: 34, icon: '🏢' },
];

const quickFilters = ['Бакалавриат', 'Магистратура', 'Бюджет', 'Контракт', 'Старосты'];

const statusClass: Record<string, string> = {
    online: styles.statusOnline,
    idle: styles.statusIdle,
    offline: styles.statusOffline,
};

const ContactsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [activeCourse, setActiveCourse] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <h1>Контакты университета</h1>
                    <p>Управление базой данных студентов, преподавателей и персонала</p>
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
                    <button className={styles.btnAddContact}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Добавить контакт
                    </button>
                </div>
            </div>

            <div className={styles.tabs}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span className={styles.tabIcon}>{tab.icon}</span>
                        <span>{tab.label}</span>
                        <span className={styles.tabCount}>{tab.count}</span>
                    </button>
                ))}
            </div>

            <div className={styles.filtersBar}>
                <div className={styles.searchWrapper}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Поиск по имени, ID, группе или email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filterActions}>
                    <div className={styles.courseFilter}>
                        <span className={styles.courseFilterLabel}>КУРС:</span>
                        {['all', '1', '2', '3', '4'].map((c) => (
                            <button
                                key={c}
                                className={`${styles.courseFilterBtn} ${activeCourse === c ? styles.active : ''}`}
                                onClick={() => setActiveCourse(c)}
                            >
                                {c === 'all' ? 'Все' : c}
                            </button>
                        ))}
                    </div>
                    <button className={styles.filterBtn}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Фильтры
                    </button>
                    <button className={styles.filterBtn}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3M10.5 5L8 2.5 5.5 5M8 2.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Экспорт
                    </button>
                </div>
            </div>

            <div className={styles.quickFilters}>
                <span className={styles.quickFilterLabel}>БЫСТРЫЙ ФИЛЬТР:</span>
                {quickFilters.map((f) => (
                    <button key={f} className={styles.quickFilterChip}>{f}</button>
                ))}
            </div>

            <div className={styles.grid}>
                {contacts.map((contact) => (
                    <div
                        key={contact.id}
                        className={styles.card}
                        style={{ borderTopColor: contact.borderColor }}
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.avatarWrapper}>
                                {contact.avatar ? (
                                    <img src={contact.avatar} alt={contact.name} className={styles.avatar} />
                                ) : contact.initials ? (
                                    <div className={styles.avatarInitials} style={{ background: contact.avatarBg }}>
                                        {contact.initials}
                                    </div>
                                ) : (
                                    <div className={styles.avatarPlaceholder} style={{ background: contact.avatarBg }}>
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                            <circle cx="16" cy="12" r="5" stroke="#94A3B8" strokeWidth="1.5" />
                                            <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#94A3B8" strokeWidth="1.5" />
                                        </svg>
                                    </div>
                                )}
                                <span className={`${styles.statusDot} ${statusClass[contact.status]}`} />
                            </div>
                            <button className={styles.menuBtn}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="4" cy="8" r="1.25" fill="currentColor" />
                                    <circle cx="8" cy="8" r="1.25" fill="currentColor" />
                                    <circle cx="12" cy="8" r="1.25" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                        <div className={styles.cardBody}>
                            <h3 className={styles.contactName}>{contact.name}</h3>
                            <p className={styles.contactMeta}>
                                ID: {contact.studentId} ·{' '}
                                <span style={{ color: contact.groupColor, fontWeight: 500 }}>
                                    Группа {contact.group}
                                </span>
                            </p>
                            <span
                                className={styles.levelBadge}
                                style={{ background: `${contact.levelColor}14`, color: contact.levelColor }}
                            >
                                {contact.level}
                            </span>
                        </div>
                        <div className={styles.cardSkills}>
                            <span className={styles.skillsLabel}>НАВЫКИ</span>
                            {contact.skills.length > 0 ? (
                                <div className={styles.skillsTags}>
                                    {contact.skills.map((skill) => (
                                        <span key={skill} className={styles.skillTag}>{skill}</span>
                                    ))}
                                </div>
                            ) : (
                                <span className={styles.noSkills}>Нет навыков</span>
                            )}
                        </div>
                        <div className={styles.cardActions}>
                            <button className={styles.actionBtn}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M2.333 2.333h9.334c.645 0 1.166.522 1.166 1.167v7c0 .645-.521 1.167-1.166 1.167H2.333c-.645 0-1.167-.522-1.167-1.167v-7c0-.645.522-1.167 1.167-1.167z" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M12.833 3.5L7 7.583 1.167 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                Email
                            </button>
                            <button className={styles.actionBtn}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M12.25 1.75L6.125 7.875M12.25 1.75L8.75 12.25l-2.625-4.375L1.75 5.25l10.5-3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Telegram
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                    Показано <strong>1 - 6</strong> из <strong>842</strong> студентов
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
                    <button className={styles.paginationBtn}>12</button>
                    <button className={styles.paginationBtn}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactsPage;
