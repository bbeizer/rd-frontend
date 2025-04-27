import axios from 'axios';

/**
 * Core apiClient with typing
 */
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Quick POST helper with type
 */
export const apiPost = async <T>(
    path: string,
    body: any
): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
        const { data } = await apiClient.post<T>(path, body);
        return { success: true, data };
    } catch (error: any) {
        console.error('apiPost failed:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Quick PATCH helper with type
 */
export const apiPatch = async <T>(
    path: string,
    body: any
): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
        const { data } = await apiClient.patch<T>(path, body);
        return { success: true, data };
    } catch (error: any) {
        console.error('apiPatch failed:', error.message);
        return { success: false, error: error.message };
    }
};
