/**
 * ============================================================
 * ВАЖНО: ЧТО НУЖНО СДЕЛАТЬ ДЛЯ РАБОТЫ АВТОРИЗАЦИИ
 * ============================================================
 *
 * 1. ЗАРЕГИСТРИРОВАТЬ ПРИЛОЖЕНИЕ У ПРОВАЙДЕРОВ
 *    - Google: https://console.cloud.google.com → OAuth 2.0 Client IDs
 *      redirect_uri = http://localhost:5173/auth/callback  (dev)
 *                   = https://your-domain.com/auth/callback (prod)
 *    - Яндекс: https://oauth.yandex.ru/client/new
 *      redirect_uri = то же самое
 *    - ИТМО ID: обратиться в IT-отдел ИТМО, запросить client_id
 *      (провайдер Keycloak: https://id.itmo.ru/auth/realms/itmo/...)
 *
 * 2. СОЗДАТЬ ФАЙЛ .env В КОРНЕ КЛИЕНТА (client/.env)
 *    VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
 *    VITE_YANDEX_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *    VITE_ITMO_CLIENT_ID=your-itmo-client-id
 *
 * 3. РЕАЛИЗОВАТЬ ЭНДПОИНТ НА БЭКЕНДЕ:
 *    POST /api/auth/callback
 *    Body: { code: string, provider: 'google'|'yandex'|'itmo', redirect_uri: string }
 *    Response: { user: { id, name, email, avatar?, role: 'guest', provider }, token: string }
 *    Логика:
 *      - Обменять code на access_token у провайдера
 *      - Получить профиль пользователя (userinfo endpoint)
 *      - Найти или создать пользователя в БД (role = 'guest' при первом входе)
 *      - Вернуть JWT токен + данные пользователя
 *
 * 4. ДОБАВИТЬ redirect_uri В WHITELIST У КАЖДОГО ПРОВАЙДЕРА
 *    (обычно делается в настройках приложения на стороне провайдера)
 * ============================================================
 */

import React from 'react';
import yandexIcon from '../../icons/yandex.svg';
import googleIcon from '../../icons/google.svg';
import itmoIcon from '../../icons/itmo.svg';
import styles from './LoginPage.module.css';

type OAuthProvider = 'yandex' | 'google' | 'itmo';

const OAUTH_CONFIG: Record<OAuthProvider, { authUrl: string; clientId: string; scope?: string }> = {
  yandex: {
    authUrl: 'https://oauth.yandex.ru/authorize',
    clientId: import.meta.env.VITE_YANDEX_CLIENT_ID ?? 'YANDEX_CLIENT_ID',
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'GOOGLE_CLIENT_ID',
    scope: 'openid email profile',
  },
  itmo: {
    authUrl: 'https://id.itmo.ru/auth/realms/itmo/protocol/openid-connect/auth',
    clientId: import.meta.env.VITE_ITMO_CLIENT_ID ?? 'ITMO_CLIENT_ID',
    scope: 'openid email profile',
  },
};

const redirectToOAuth = (provider: OAuthProvider) => {
  const redirectUri = `${window.location.origin}/auth/callback`;
  const state = btoa(JSON.stringify({ provider }));
  const cfg = OAUTH_CONFIG[provider];

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    ...(cfg.scope ? { scope: cfg.scope } : {}),
  });

  window.location.href = `${cfg.authUrl}?${params}`;
};

const providers: { key: OAuthProvider; label: string; icon: string; className: string }[] = [
  { key: 'yandex', label: 'Войти через Яндекс', icon: yandexIcon, className: styles.btnYandex },
  { key: 'google', label: 'Войти через Google', icon: googleIcon, className: '' },
  { key: 'itmo',   label: 'Войти через ИТМО ID', icon: itmoIcon,  className: styles.btnItmo },
];

const LoginPage: React.FC = () => {
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
              onClick={() => redirectToOAuth(key)}
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

      <p className={styles.footer}>UniDataBase &mdash; Единый справочник контактов</p>
    </div>
  );
};

export default LoginPage;
