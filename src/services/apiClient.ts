const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
/**
 * Core apiClient with typing
 */
export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<{ success: boolean; data: T }> {
  const response = await fetch(`${baseUrl}${path}`, options);

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`API Error: ${response.status} ${errorMessage}`);
  }

  return response.json();
}

/**
 * Quick POST helper with type
 */
export const apiPost = async <T>(
  path: string,
  body: any
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const { data } = await apiClient<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('apiPost failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const apiPatch = async <T>(
  path: string,
  body: any
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const { data } = await apiClient<T>(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('apiPatch failed:', error.message);
    return { success: false, error: error.message };
  }
};
