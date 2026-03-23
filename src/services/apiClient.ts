import axios from 'axios';

/**
 * Core apiClient with typing
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Quick POST helper with type
 */
export const apiPost = async <T>(
  path: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const { data } = await apiClient.post<T>(path, body);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
};

/**
 * Quick PATCH helper with type
 */
export const apiPatch = async <T>(
  path: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const { data } = await apiClient.patch<T>(path, body);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('apiPatch failed:', message);
    return { success: false, error: message };
  }
};

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';
}
