import { getGameById } from '../../../services/gameService';

export async function fetchGame(gameId, updateState, currentPlayerColor) {
  try {
    const fetchedGame = await getGameById(gameId);
    const isSinglePlayer = fetchedGame.gameType === 'single';
    const playerColor = isSinglePlayer ? 'white' : currentPlayerColor;
    updateState(prevState => ({
      ...prevState,
      gameData: fetchedGame,
      gameType: fetchedGame.gameType,
      winner: fetchedGame.winner,
      playerColor: playerColor,
      isUserTurn: fetchedGame.currentPlayerTurn === currentPlayerColor,
      currentBoardStatus: fetchedGame.currentBoardStatus
    }));
  } catch (error) {
    console.error('Error fetching game data:', error);
  }
}
