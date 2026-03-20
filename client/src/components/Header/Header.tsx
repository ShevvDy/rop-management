import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';

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

    const avatarUrl = user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name ?? 'user')}&backgroundColor=b6e3f4`;

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <div className={styles.brand}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <circle cx="14" cy="14" r="14" fill="#3B82F6" />
                        <path d="M14 8l-6 3 6 3 6-3-6-3z" fill="#fff" />
                        <path d="M8 14l6 3 6-3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M8 17l6 3 6-3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span className={styles.brandName}>UniDataBase</span>
                    <span className={styles.brandDivider}>|</span>
                    <span className={styles.brandDescription}>Единый справочник контактов</span>
                </div>
            </div>

            <div className={styles.right}>
                <button className={styles.iconBtn}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M15 6.667a5 5 0 10-10 0c0 5.833-2.5 7.5-2.5 7.5h15s-2.5-1.667-2.5-7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M11.442 16.667a1.667 1.667 0 01-2.884 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button className={styles.iconBtn}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M17.5 12.5c0 .442-.176.866-.488 1.178-.313.313-.737.489-1.179.489H5.833L2.5 17.5V4.167c0-.442.176-.866.488-1.179A1.667 1.667 0 014.167 2.5h11.666c.442 0 .866.176 1.179.488.312.313.488.737.488 1.179V12.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className={styles.user} ref={dropdownRef}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.name ?? '—'}</span>
                        <span className={styles.userRole}>{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
                    </div>
                    <button
                        className={styles.avatarBtn}
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <img src={avatarUrl} alt="avatar" />
                    </button>

                    {showDropdown && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownProfile}>
                                <img src={avatarUrl} alt="avatar" className={styles.dropdownAvatar} />
                                <div className={styles.dropdownInfo}>
                                    <span className={styles.dropdownName}>{user?.name}</span>
                                    <span className={styles.dropdownEmail}>{user?.email}</span>
                                </div>
                            </div>
                            <div className={styles.dropdownDivider} />
                            <button className={styles.dropdownItem} onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" />
                                    <path d="M3 16.5c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                                Профиль
                            </button>
                            <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={() => { setShowDropdown(false); logout(); navigate('/login'); }}>
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
