import type { GameState } from '../types/GameState';

const aiMoveEndpoint = import.meta.env.VITE_AI_SERVICE_URL;

export async function getAIMove(game: GameState, color: String) {
  try {
    console.log('Sending gameState to AI service:', game);
    const response = await fetch(aiMoveEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, color }),
    });

    console.log('Raw response:', response);

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch AI move: ${response.statusText}`);
    }

    const responseBody = await response.text();
    console.log('Raw response body:', responseBody);

    let updatedGame;
    try {
      updatedGame = JSON.parse(responseBody);
    } catch (parseError) {
      throw new Error('Failed to parse JSON from AI service');
    }

    console.log('Parsed response JSON:', updatedGame);
    return updatedGame;
  } catch (error) {
    console.error('Error fetching AI move:', error);
    throw error;
  }
}
