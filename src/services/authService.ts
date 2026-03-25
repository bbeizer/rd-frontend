import { apiClient } from './apiClient';
import type { User } from '@/types/User';

interface AuthResponse {
  token: string;
  user: User;
}

export const register = async (
  email: string,
  username: string,
  password: string
): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
  try {
    const { data } = await apiClient.post<AuthResponse>('/api/users/register', {
      email,
      username,
      password,
    });
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return { success: false, error: message };
  }
};

export const login = async (
  email: string,
  password: string
): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
  try {
    const { data } = await apiClient.post<AuthResponse>('/api/users/login', {
      email,
      password,
    });
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return { success: false, error: message };
  }
};

export const getMe = async (
  token: string
): Promise<{ success: boolean; data?: User; error?: string }> => {
  try {
    const { data } = await apiClient.get<User>('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    return { success: false, error: message };
  }
};

export const updateMe = async (
  token: string,
  updates: Partial<Pick<User, 'username'>>
): Promise<{ success: boolean; data?: User; error?: string }> => {
  try {
    const { data } = await apiClient.patch<User>('/api/users/me', updates, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    return { success: false, error: message };
  }
};

export const deleteMe = async (token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiClient.delete('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete account';
    return { success: false, error: message };
  }
};

export const getUserGames = async (
  userId: string
): Promise<{ success: boolean; data?: string[]; error?: string }> => {
  try {
    const { data } = await apiClient.get<string[]>(`/api/users/${userId}/games`);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get games';
    return { success: false, error: message };
  }
};
