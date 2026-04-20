import React, { useState } from 'react';
import { useAuth, getUserRole } from '../../contexts/AuthContext';
import { apiClient } from '../../api';
import styles from './ProfilePage.module.css';

const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth();

    const [editing, setEditing] = useState(false);
    const [telegram, setTelegram] = useState(user?.telegram ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [saving, setSaving] = useState(false);

    const role = getUserRole(user);
    const fullName = [user?.surname, user?.name, user?.patronymic].filter(Boolean).join(' ') || '—';
    const avatarUrl = user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=b6e3f4`;

    const handleEdit = () => {
        setTelegram(user?.telegram ?? '');
        setPhone(user?.phone ?? '');
        setEditing(true);
    };

    const handleCancel = () => {
        setEditing(false);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await apiClient.put(`/user/${user.user_id}`, {
                telegram: telegram.trim() || null,
                phone: phone.trim() || null,
            });
            await refreshUser();
            setEditing(false);
        } catch {
            // TODO: toast
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <h1>Профиль пользователя</h1>
                <p>Управление личными данными и настройками аккаунта</p>
            </div>

            <div className={styles.grid}>
                {/* Main card */}
                <div className={`${styles.card} ${styles.cardMain}`}>
                    <div className={styles.cardBanner} />
                    <div className={styles.cardBody}>
                        <div className={styles.avatarWrapper}>
                            <img
                                src={avatarUrl}
                                alt="avatar"
                                className={styles.avatarLarge}
                            />
                        </div>
                        <h2 className={styles.name}>{fullName}</h2>
                        <span className={styles.roleBadge} style={{ color: role.color, background: role.bg }}>
                            {role.label}
                        </span>
                    </div>
                </div>

                {/* Info card */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M3 16.5c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        Личная информация
                    </div>

                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <label>Полное имя</label>
                            <span>{fullName}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Email</label>
                            <span>{user?.email ?? '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Телефон</label>
                            {editing ? (
                                <input
                                    className={styles.editInput}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+7 (999) 123-45-67"
                                />
                            ) : (
                                <span>{user?.phone ?? '—'}</span>
                            )}
                        </div>
                        <div className={styles.infoItem}>
                            <label>Telegram</label>
                            {editing ? (
                                <input
                                    className={styles.editInput}
                                    value={telegram}
                                    onChange={(e) => setTelegram(e.target.value)}
                                    placeholder="@username"
                                />
                            ) : (
                                <span>{user?.telegram ?? '—'}</span>
                            )}
                        </div>
                        <div className={styles.infoItem}>
                            <label>ISU ID</label>
                            <span>{user?.isu_id ?? '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Роль</label>
                            <span style={{ color: role.color, fontWeight: 600 }}>{role.label}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Теги</label>
                            <span>
                                {user?.tags && user.tags.length > 0
                                    ? user.tags.map((t) => t.name).join(', ')
                                    : '—'}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Провайдер</label>
                            <span>{user?.provider ?? '—'}</span>
                        </div>
                    </div>

                    {editing ? (
                        <div className={styles.editActions}>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
                                Отмена
                            </button>
                        </div>
                    ) : (
                        <button className={styles.editInfoBtn} onClick={handleEdit}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Редактировать
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
