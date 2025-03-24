const baseUrl =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : import.meta.env.VITE_BACKEND_BASE_URL;

if (!baseUrl) {
  console.error('⚠️ VITE_BACKEND_BASE_URL is not set! Check your .env file.');
}

export const joinQueue = async (
  playerId: string,
  playerName: string
): Promise<any> => {
  try {
    const response = await fetch(`${baseUrl}/api/games/joinMultiplayerGame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, playerName }),
    });

    if (!response.ok) throw new Error(`Failed to join queue: ${response.statusText}`);

    return await response.json();
  } catch (error: any) {
    console.error('Could not add player to the queue:', error.message);
    throw error;
  }
};

export const startSinglePlayerGame = async (
  playerId: string,
  playerName: string,
  playerColor: string
): Promise<any> => {
  try {
    const response = await fetch(`${baseUrl}/api/games/startSinglePlayerGame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, playerName, playerColor }),
    });

    if (!response.ok) throw new Error(`Failed to start game: ${response.statusText}`);

    return await response.json();
  } catch (error: any) {
    console.error('Could not start single-player game:', error.message);
    throw error;
  }
};


export const getGameById = async (id: string) => {
  try {
    const response = await fetch(`${baseUrl}/api/games/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });;

    if (!response.ok) throw new Error(`Failed to fetch game: ${response.statusText}`);

    return await response.json();
  } catch (error: any) {
    console.error('Could not fetch game:', error.message);
    throw error;
  }
};

export const updateGame = async (gameId: string, gameData: any) => {
  try {
    const response = await fetch(`${baseUrl}/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData),
    });

    if (!response.ok) throw new Error(`Failed to update game: ${response.statusText}`);

    return await response.json();
  } catch (error: any) {
    console.error('Could not update game:', error.message);
    throw error;
  }
};
