import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAccessToken, setSessionExpiredHandler } from '../../lib/api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: {
    name: string;
    permissions: string[];
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const hasPermission = (permission: string) => {
    return user?.role.permissions.includes(permission) ?? false;
  };

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
    });

    api.get<{ data: User }>('/auth/me')
      .then((res) => {
        // me endpoint implies we might need a valid token. If we don't have it, the interceptor will try to refresh.
        // Wait, the interceptor will refresh if it gets 401. So this will automatically handle session restoration.
        setUser(res.data.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
