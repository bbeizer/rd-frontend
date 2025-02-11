import { getGameById } from '../../../services/gameService';

export async function fetchGame(gameId, updateState, currentPlayerColor) {
  try {
    const fetchedGame = await getGameById(gameId);
    const isSinglePlayer = fetchedGame.gameType === 'single';
    const playerColor = isSinglePlayer ? 'white' : currentPlayerColor;

    updateState(prevState => ({
      ...prevState,
      gameData: fetchedGame, // The entire game object from backend
      gameType: fetchedGame.gameType,
      playerColor: playerColor,
      isUserTurn: isSinglePlayer ? true : fetchedGame.currentPlayerTurn === currentPlayerColor
    }));
  } catch (error) {
    console.error('Error fetching game data:', error);
  }
}

