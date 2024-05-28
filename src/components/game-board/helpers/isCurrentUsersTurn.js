import { getGameById } from '../../../services/gameService';

export const isCurrentUsersTurn = async (gameId, playerColor) => {
    try {
        const game = await getGameById(gameId);
        if (game.turnPlayer !== playerColor) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error('Failed to check the player turn:', error);
        throw error;  // Optionally re-throw the error if you want calling code to handle it
    }
};
