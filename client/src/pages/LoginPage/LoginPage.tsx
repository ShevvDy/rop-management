import React, { useState } from 'react';
import axios from 'axios';
import yandexIcon from '../../icons/yandex.svg';
import googleIcon from '../../icons/google.svg';
import itmoIcon from '../../icons/itmo.svg';
import styles from './LoginPage.module.css';

type OAuthProvider = 'yandex' | 'google' | 'itmo';

const redirectToOAuth = async (provider: OAuthProvider) => {
  if (provider === 'yandex') {
    const { data } = await axios.get<{
      auth_url: string;
      code_verifier: string;
      code_challenge: string;
    }>('/auth/login');

    sessionStorage.setItem('pkce_code_verifier', data.code_verifier);
    sessionStorage.setItem('oauth_provider', provider);
    window.location.href = data.auth_url;
    return;
  }

  // Google / ИТМО — пока не поддержаны на бэке
  console.warn(`Provider "${provider}" is not yet supported`);
};

const providers: { key: OAuthProvider; label: string; icon: string; className: string }[] = [
  { key: 'yandex', label: 'Войти через Яндекс', icon: yandexIcon, className: styles.btnYandex },
  { key: 'google', label: 'Войти через Google', icon: googleIcon, className: '' },
  { key: 'itmo',   label: 'Войти через ИТМО ID', icon: itmoIcon,  className: styles.btnItmo },
];

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (provider: OAuthProvider) => {
    setLoading(true);
    try {
      await redirectToOAuth(provider);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#EBF1FF" />
            <path d="M24 13l-10 5 10 5 10-5-10-5z" fill="#3B82F6" />
            <path d="M14 24l10 5 10-5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 29l10 5 10-5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className={styles.title}>Добро пожаловать</h1>
        <p className={styles.subtitle}>
          Войдите в систему управления РОП через один из доступных провайдеров
        </p>

        <div className={styles.providers}>
          {providers.map(({ key, label, icon, className }) => (
            <button
              key={key}
              className={`${styles.providerBtn} ${className}`}
              onClick={() => handleLogin(key)}
              disabled={loading}
            >
              <span className={styles.providerIcon}>
                <img src={icon} style={{ borderRadius: '12px' }} width={24} height={24} alt={key} />
              </span>
              <span className={styles.providerLabel}>{label}</span>
              <span className={styles.providerArrow}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          ))}
        </div>

        <p className={styles.notice}>
          После первого входа вам будет присвоена роль <strong>Гость</strong>.
          Доступ к функциям системы предоставляется администратором.
        </p>
      </div>

      <p className={styles.footer}>UNITMO &mdash; Единый справочник контактов</p>
    </div>
  );
};

export default LoginPage;
