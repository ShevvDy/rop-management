import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
    guest: 'Гость',
    moderator: 'Модератор',
    admin: 'Администратор',
};

const Header: React.FC = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="app-header">
            <div className="header-left">
                <div className="header-brand">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <circle cx="14" cy="14" r="14" fill="#3B82F6" />
                        <path d="M14 8l-6 3 6 3 6-3-6-3z" fill="#fff" />
                        <path d="M8 14l6 3 6-3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M8 17l6 3 6-3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span className="header-brand-name">UniDataBase</span>
                    <span className="header-brand-divider">|</span>
                    <span className="header-brand-description">Единый справочник контактов</span>
                </div>
            </div>

            <div className="header-right">
                <button className="header-icon-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M15 6.667a5 5 0 10-10 0c0 5.833-2.5 7.5-2.5 7.5h15s-2.5-1.667-2.5-7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M11.442 16.667a1.667 1.667 0 01-2.884 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button className="header-icon-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M17.5 12.5c0 .442-.176.866-.488 1.178-.313.313-.737.489-1.179.489H5.833L2.5 17.5V4.167c0-.442.176-.866.488-1.179A1.667 1.667 0 014.167 2.5h11.666c.442 0 .866.176 1.179.488.312.313.488.737.488 1.179V12.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className="header-user" ref={dropdownRef}>
                    <div className="header-user-info">
                        <span className="header-user-name">{user?.name ?? '—'}</span>
                        <span className="header-user-role">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
                    </div>
                    <button
                        className="header-user-avatar-btn"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <img
                            src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name ?? 'user')}&backgroundColor=b6e3f4`}
                            alt="avatar"
                        />
                    </button>

                    {showDropdown && (
                        <div className="header-dropdown">
                            <div className="header-dropdown-profile">
                                <img
                                    src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name ?? 'user')}&backgroundColor=b6e3f4`}
                                    alt="avatar"
                                    className="header-dropdown-avatar"
                                />
                                <div className="header-dropdown-info">
                                    <span className="header-dropdown-name">{user?.name}</span>
                                    <span className="header-dropdown-email">{user?.email}</span>
                                </div>
                            </div>
                            <div className="header-dropdown-divider" />
                            <button className="header-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" />
                                    <path d="M3 16.5c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                                Профиль
                            </button>
                            <button className="header-dropdown-item header-dropdown-logout" onClick={() => { setShowDropdown(false); logout(); navigate('/login'); }}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M6.75 15.75H3.75a1.5 1.5 0 01-1.5-1.5V3.75a1.5 1.5 0 011.5-1.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 12.75L15.75 9 12 5.25M6 9h9.75" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
