import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export type OAuthProvider = 'yandex' | 'google' | 'itmo';

export interface UserTag {
  tag_id: number;
  name: string;
}

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
  is_admin?: boolean;
  tags?: UserTag[];
  student_data?: unknown[];
  teacher_data?: unknown[];
  directed_cohorts?: unknown[];
  managed_cohorts?: unknown[];
}

export type UserRole = 'admin' | 'cohort_director' | 'cohort_manager' | 'teacher' | 'student' | 'guest';

export interface UserRoleInfo {
  key: UserRole;
  label: string;
  color: string;
  bg: string;
}

const ROLE_MAP: Record<UserRole, Omit<UserRoleInfo, 'key'>> = {
  admin:            { label: 'Администратор',   color: '#DC2626', bg: '#FEF2F2' },
  cohort_director:  { label: 'Руководитель ОП', color: '#7C3AED', bg: '#F5F3FF' },
  cohort_manager:   { label: 'Менеджер ОП',     color: '#D97706', bg: '#FFFBEB' },
  teacher:          { label: 'Преподаватель',    color: '#16A34A', bg: '#F0FDF4' },
  student:          { label: 'Студент',          color: '#2563EB', bg: '#EFF6FF' },
  guest:            { label: 'Гость',            color: '#64748B', bg: '#F1F5F9' },
};

export function getUserRole(user: User | null): UserRoleInfo {
  if (!user) return { key: 'guest', ...ROLE_MAP.guest };
  if (user.is_admin) return { key: 'admin', ...ROLE_MAP.admin };
  if (user.directed_cohorts && user.directed_cohorts.length > 0) return { key: 'cohort_director', ...ROLE_MAP.cohort_director };
  if (user.managed_cohorts && user.managed_cohorts.length > 0) return { key: 'cohort_manager', ...ROLE_MAP.cohort_manager };
  if (user.teacher_data && user.teacher_data.length > 0) return { key: 'teacher', ...ROLE_MAP.teacher };
  if (user.student_data && user.student_data.length > 0) return { key: 'student', ...ROLE_MAP.student };
  return { key: 'guest', ...ROLE_MAP.guest };
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  role: UserRoleInfo;
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
    let cancelled = false;
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
          if (cancelled) return;
          if (fresh) {
            const updated = { ...fresh, provider: parsed.provider };
            setUser(updated);
            localStorage.setItem('auth_user', JSON.stringify(updated));
          }
          setLoading(false);
        });
        return () => { cancelled = true; };
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
    return () => { cancelled = true; };
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

  const role = getUserRole(user);

  return (
    <AuthContext.Provider value={{ user, token, role, isAuthenticated: !!user, loading, setAuth, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
