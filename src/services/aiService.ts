import type { GameState } from '../types/GameState';

// Simple endpoint configuration - can be overridden by environment variables
const aiMoveEndpoint = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

export async function getAIMove(game: GameState, color: string) {
  const response = await fetch(aiMoveEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game, color }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AI move: ${response.statusText}`);
  }

  const responseBody = await response.text();

  try {
    return JSON.parse(responseBody);
  } catch {
    throw new Error('Failed to parse JSON from AI service');
  }
}
