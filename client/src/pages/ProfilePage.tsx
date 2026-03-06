import React from 'react';

const ProfilePage: React.FC = () => {
    return (
        <div className="profile-page">
            <div className="profile-page-header">
                <h1>Профиль пользователя</h1>
                <p>Управление личными данными и настройками аккаунта</p>
            </div>

            <div className="profile-grid">
                {/* Main card */}
                <div className="profile-card profile-card-main">
                    <div className="profile-card-banner" />
                    <div className="profile-card-body">
                        <div className="profile-avatar-wrapper">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander&backgroundColor=b6e3f4"
                                alt="avatar"
                                className="profile-avatar-large"
                            />
                            <button className="profile-avatar-edit">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M10.083 1.458a1.237 1.237 0 011.75 1.75L6.5 8.542l-2.333.583.583-2.333 5.333-5.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <h2 className="profile-name">Александр Петров</h2>
                        <span className="profile-role-badge">Администратор</span>
                        <p className="profile-bio">Системный администратор университетской платформы управления данными</p>
                    </div>
                </div>

                {/* Info card */}
                <div className="profile-card">
                    <div className="profile-card-title">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M3 16.5c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        Личная информация
                    </div>

                    <div className="profile-info-grid">
                        <div className="profile-info-item">
                            <label>Полное имя</label>
                            <span>Петров Александр Сергеевич</span>
                        </div>
                        <div className="profile-info-item">
                            <label>Email</label>
                            <span>a.petrov@univ.edu</span>
                        </div>
                        <div className="profile-info-item">
                            <label>Телефон</label>
                            <span>+7 (999) 123-45-67</span>
                        </div>
                        <div className="profile-info-item">
                            <label>Отдел</label>
                            <span>ИТ Администрация</span>
                        </div>
                        <div className="profile-info-item">
                            <label>Должность</label>
                            <span>Старший системный администратор</span>
                        </div>
                        <div className="profile-info-item">
                            <label>Дата регистрации</label>
                            <span>15 сентября 2022</span>
                        </div>
                    </div>

                    <button className="profile-edit-info-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Редактировать
                    </button>
                </div>

                {/* Security card */}
                <div className="profile-card">
                    <div className="profile-card-title">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <rect x="3" y="7.5" width="12" height="8.25" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M5.25 7.5V5.25a3.75 3.75 0 017.5 0V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            <circle cx="9" cy="11.25" r="1.125" fill="currentColor" />
                        </svg>
                        Безопасность
                    </div>

                    <div className="profile-security-items">
                        <div className="profile-security-row">
                            <div className="profile-security-info">
                                <span className="profile-security-label">Пароль</span>
                                <span className="profile-security-value">Последнее изменение: 2 месяца назад</span>
                            </div>
                            <button className="profile-security-btn">Изменить</button>
                        </div>
                        <div className="profile-security-row">
                            <div className="profile-security-info">
                                <span className="profile-security-label">Двухфакторная аутентификация</span>
                                <span className="profile-security-value">Не настроена</span>
                            </div>
                            <button className="profile-security-btn">Настроить</button>
                        </div>
                        <div className="profile-security-row">
                            <div className="profile-security-info">
                                <span className="profile-security-label">Активные сессии</span>
                                <span className="profile-security-value">2 устройства</span>
                            </div>
                            <button className="profile-security-btn">Управление</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
