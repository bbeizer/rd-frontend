
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const sendFeedbackEmail = async (name: string, message: string) => {
    const response = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to send feedback');
    }
  };