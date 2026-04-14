import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types/student';
import { authenticate } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, login: () => false, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('sms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((username: string, password: string) => {
    const u = authenticate(username, password);
    if (u) {
      setUser(u);
      sessionStorage.setItem('sms_user', JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('sms_user');
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
