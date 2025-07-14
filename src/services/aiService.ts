import { getEnv } from '../utils/env';
import type { GameState } from '../types/GameState';

// Simple endpoint configuration - can be overridden by environment variables
const aiMoveEndpoint = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

export async function getAIMove(game: GameState, color: String) {
  try {
    const response = await fetch(aiMoveEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, color }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch AI move: ${response.statusText}`);
    }

    const responseBody = await response.text();

    let updatedGame;
    try {
      updatedGame = JSON.parse(responseBody);
    } catch (parseError) {
      throw new Error('Failed to parse JSON from AI service');
    }

    return updatedGame;
  } catch (error) {
    throw error;
  }
}
