const AI_SERVICE_URL = import.meta.env.REACT_APP_AI_SERVICE_URL;
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL;

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

export const startSinglePlayerGame = async (playerId, playerName) => {
    try {
        const response = await fetch(`${baseUrl}/games/joinGame`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId, playerName }),
        });
        if (!response.ok) {
        throw new Error(`Failed to join game: ${response.statusText}`);
        }
        const data = await response.json();
        return data;  // Returning the whole response including game and playerColor
    } catch (error) {
        console.error('Could not add player to the queue:', error);
        throw error;
    }
};
