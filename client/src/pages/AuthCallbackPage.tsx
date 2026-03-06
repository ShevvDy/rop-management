import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth, type User, type OAuthProvider } from '../contexts/AuthContext';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    // Предотвращаем двойной вызов в StrictMode
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=access_denied', { replace: true });
      return;
    }

    if (!code || !state) {
      navigate('/login?error=invalid_callback', { replace: true });
      return;
    }

    let provider: OAuthProvider;
    try {
      const parsed = JSON.parse(atob(state));
      provider = parsed.provider;
    } catch {
      navigate('/login?error=invalid_state', { replace: true });
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    // POST /api/auth/callback — бэкенд обменивает code на токен и возвращает данные пользователя
    axios
      .post<{ user: User; token: string }>('/api/auth/callback', {
        code,
        provider,
        redirect_uri: redirectUri,
      })
      .then(({ data }) => {
        // Новый пользователь приходит с role: 'guest' (устанавливается на бэкенде)
        setAuth(data.user, data.token);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=auth_failed', { replace: true });
      });
  }, []);

  return (
    <div className="auth-callback-page">
      <div className="auth-callback-spinner">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="auth-callback-spin">
          <circle cx="20" cy="20" r="17" stroke="#EBF1FF" strokeWidth="4" />
          <path d="M20 3a17 17 0 0 1 17 17" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="auth-callback-text">Выполняется вход...</p>
    </div>
  );
};

export default AuthCallbackPage;
