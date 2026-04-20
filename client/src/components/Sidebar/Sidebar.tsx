import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

const navItems = [
    { path: '/dashboard', label: 'Дашборд', icon: 'dashboard' },
    { path: '/contacts', label: 'Справочник контактов', icon: 'contacts' },
    { path: '/students', label: 'Журнал студентов', icon: 'students' },
    { path: '/data-upload', label: 'Загрузка данных', icon: 'upload' },
    { path: '/roles', label: 'Управление ролями', icon: 'roles' },
];

const iconMap: Record<string, React.ReactNode> = {
    dashboard: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    ),
    contacts: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3.5 17.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    students: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 4.5h14M3 4.5v12a1 1 0 001 1h12a1 1 0 001-1v-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 1.5v3M13 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 9h3M6 12.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M13.5 9.5l-1 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12.5 13h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    ),
    upload: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    roles: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 6h6M7 9.5h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15" cy="15" r="4" fill="white" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 15l1 1 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="18" fill="#EBF1FF" />
                        <path d="M18 10l-8 4 8 4 8-4-8-4z" fill="#3B82F6" />
                        <path d="M10 18l8 4 8-4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 22l8 4 8-4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className={styles.logoText}>
                    <span className={styles.logoTitle}>Админ-панель</span>
                    {/* <span className={styles.logoSubtitle}>Университет</span> */}
                </div>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>{iconMap[item.icon]}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M6.75 15.75H3.75a1.5 1.5 0 01-1.5-1.5V3.75a1.5 1.5 0 011.5-1.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 12.75L15.75 9 12 5.25M6 9h9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Выйти</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
