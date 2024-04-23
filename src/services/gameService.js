// src/services/gameService.js
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
console.log(`${baseUrl}/games`);
export const createGame = async (gameData) => {
  try {
    const response = await fetch(`${baseUrl}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include other headers as needed, e.g., authorization tokens
      },
      body: JSON.stringify(gameData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Could not create a new game:', error);
    throw error; // Rethrowing the error is usually a good practice so that calling code can handle it
  }
};

export const readGame = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/games/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include other headers as needed, e.g., authorization tokens
      },
      body: JSON.stringify(gameData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Could not create a new game:', error);
    throw error;
  }
}

export const updateGameState = async (req, res) => {
  const { id } = req.params; // Get game ID from URL
  const updates = req.body; // Get updates from request body

  try {
      const game = await Game.findByIdAndUpdate(id, updates, { new: true });
      if (!game) {
          return res.status(404).send({ message: 'Game not found' });
      }
      res.json(game);
  } catch (error) {
      res.status(500).json({ message: 'Error updating game state', error: error.toString() });
  }
};
