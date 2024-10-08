import { getGameById } from '../../../services/gameService';

export async function fetchGame(gameId, updateState, currentPlayerColor) {
  try {
    const fetchedGame = await getGameById(gameId);
    updateState(prevState => ({
      ...prevState,
      gameData: fetchedGame,
      winner: fetchedGame.winner,
      isUserTurn: fetchedGame.currentPlayerTurn === currentPlayerColor,
      currentBoardStatus: fetchedGame.currentBoardStatus
    }));
  } catch (error) {
    console.error('Error fetching game data:', error);
  }
}
