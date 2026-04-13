import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export type UserRole = 'guest' | 'moderator' | 'admin';
export type OAuthProvider = 'yandex' | 'google' | 'itmo';

export interface User {
  user_id: number;
  name: string;
  surname: string;
  patronymic?: string | null;
  email?: string | null;
  phone?: string | null;
  telegram?: string | null;
  isu_id?: number | null;
  avatar?: string | null;
  provider?: OAuthProvider;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setAuth: (user: User, token: string) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (userId: number, authToken: string): Promise<User | null> => {
    try {
      const { data } = await axios.get(`/api/v1/user/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      try {
        const parsed: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);

        if (!parsed.user_id) {
          setLoading(false);
          return;
        }

        fetchUser(parsed.user_id, storedToken).then((fresh) => {
          if (fresh) {
            const updated = { ...fresh, provider: parsed.provider };
            setUser(updated);
            localStorage.setItem('auth_user', JSON.stringify(updated));
          }
          setLoading(false);
        });
        return;
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, [fetchUser]);

  const setAuth = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const refreshUser = useCallback(async () => {
    if (!user || !token) return;
    const fresh = await fetchUser(user.user_id, token);
    if (fresh) {
      const updated = { ...fresh, provider: user.provider };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  }, [user, token, fetchUser]);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, setAuth, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
