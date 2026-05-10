'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setToken, getToken, clearToken } from '@/lib/token-store';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/trpc/users.me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      // Non-batch 响应格式: {"result":{"data":{"json":{...}}}}
      if (json?.result?.data?.json) {
        setUser(json.result.data.json);
      } else {
        // Token 无效或过期
        clearToken();
      }
    } catch {
      // 网络错误不清除 token，可能只是临时断连
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 恢复会话
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback((token: string, u: AuthUser) => {
    setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
