const AI_SERVICE_URL = import.meta.env.VITE_REACT_APP_AI_SERVICE_URL;

/**
 * Sends the game state to the AI service and retrieves the AI's move.
 * @param {Object} gameState - The current game state as a JSON object.
 * @returns {Promise<Object>} - A promise that resolves with the AI's move.
 */
export async function getAIMove(gameState) {
    try {
        const response = await fetch(AI_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameState),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data.move;
    } catch (error) {
        console.error('Error fetching AI move:', error);
        throw error;
    }
}

