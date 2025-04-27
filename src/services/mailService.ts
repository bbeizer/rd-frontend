import { apiPost } from './apiClient';

export const sendFeedbackEmail = (name: string, message: string) => {
  return apiPost('/api/feedback', { name, message });
};
