import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
    { path: '/dashboard', label: 'Дашборд', icon: 'dashboard' },
    { path: '/contacts', label: 'Справочник контактов', icon: 'contacts' },
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
    upload: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    roles: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="7.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="13.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1.5 17c0-3.31 2.69-6 6-6 1.1 0 2.13.3 3 .82" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 14l1.5 1.5L17 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="18" fill="#EBF1FF" />
                        <path d="M18 10l-8 4 8 4 8-4-8-4z" fill="#3B82F6" />
                        <path d="M10 18l8 4 8-4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 22l8 4 8-4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="sidebar-logo-text">
                    <span className="sidebar-logo-title">Админ-панель</span>
                    <span className="sidebar-logo-subtitle">Университет</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="sidebar-nav-icon">{iconMap[item.icon]}</span>
                            <span className="sidebar-nav-label">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="sidebar-logout-btn" onClick={handleLogout}>
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
