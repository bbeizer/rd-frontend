// Handle response in joinQueue
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL;

export const joinQueue = async (playerId, playerName) => {
  try {
    const response = await fetch(`${baseUrl}/games/joinMultiplayerGame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerId, playerName }),
    });
    if (!response.ok) {
      throw new Error(`Failed to join game queue: ${response.statusText}`);
    }
    const data = await response.json();
    return data;  // Returning the whole response including game and playerColor
  } catch (error) {
    console.error('Could not add player to the queue:', error);
    throw error;
  }
};

export const startSinglePlayerGame = async (playerId, playerName) => {
  try {
      const response = await fetch(`${baseUrl}/games/startSinglePlayerGame`, {
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
      return data;
  } catch (error) {
      console.error('Could not add player to the queue:', error);
      throw error;
  }
};

// Use try-catch in getGameById
export const getGameById = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/games/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include other headers as needed, e.g., authorization tokens
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch game: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Could not fetch the game:', error);
    throw error;
  }
};

// Use try-catch in updateGame
export const updateGame = async (gameId, gameData) => {
  try {
    const response = await fetch(`${baseUrl}/games/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Include other headers as needed, e.g., authorization tokens
      },
      body: JSON.stringify(gameData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update the game: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Could not update the game:', error);
    throw error;
  }
};
