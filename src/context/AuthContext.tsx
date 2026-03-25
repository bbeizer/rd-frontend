import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@/types/User';
import * as authService from '@/services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (
    updates: Partial<Pick<User, 'username'>>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'authToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateToken = useCallback(async (storedToken: string) => {
    const result = await authService.getMe(storedToken);
    if (result.success && result.data) {
      setUser(result.data);
      setToken(storedToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      validateToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [validateToken]);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.data) {
      setUser(result.data.user);
      setToken(result.data.token);
      localStorage.setItem(TOKEN_KEY, result.data.token);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const register = async (email: string, username: string, password: string) => {
    const result = await authService.register(email, username, password);
    if (result.success && result.data) {
      setUser(result.data.user);
      setToken(result.data.token);
      localStorage.setItem(TOKEN_KEY, result.data.token);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const updateUser = async (updates: Partial<Pick<User, 'username'>>) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    const result = await authService.updateMe(token, updates);
    if (result.success && result.data) {
      setUser(result.data);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const deleteAccount = async () => {
    if (!token) return { success: false, error: 'Not authenticated' };
    const result = await authService.deleteMe(token);
    if (result.success) {
      logout();
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
