import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth, type OAuthProvider } from '../../contexts/AuthContext';
import styles from './AuthCallbackPage.module.css';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=access_denied', { replace: true });
      return;
    }

    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
    const provider = (searchParams.get('provider') ?? sessionStorage.getItem('oauth_provider') ?? 'yandex') as OAuthProvider;

    if (!code || !codeVerifier) {
      navigate('/login?error=invalid_callback', { replace: true });
      return;
    }

    axios
      .post(`/api/v1/auth/token/${provider}`, {
        code,
        code_verifier: codeVerifier,
      })
      .then(({ data }) => {
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_provider');

        const user = { ...data.user, provider };
        const token = data.access_token;

        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }

        setAuth(user, token);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_provider');
        navigate('/login?error=auth_failed', { replace: true });
      });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.spinner}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.spin}>
          <circle cx="20" cy="20" r="17" stroke="#EBF1FF" strokeWidth="4" />
          <path d="M20 3a17 17 0 0 1 17 17" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <p className={styles.text}>Выполняется вход...</p>
    </div>
  );
};

export default AuthCallbackPage;
