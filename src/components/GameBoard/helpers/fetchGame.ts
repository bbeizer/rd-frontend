import { GameState } from '@/types/GameState';
import { Dispatch, SetStateAction } from 'react';

export async function fetchGame(gameId: string, updateState: Dispatch<SetStateAction<GameState>>) {
  try {
    const baseUrl =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5050'
        : import.meta.env.VITE_BACKEND_BASE_URL;
    const response = await fetch(`${baseUrl}/api/games/${gameId}`);
    if (!response.ok) {
      throw new Error(`Error fetching game: ${response.statusText}`);
    }
    const gameData = await response.json();
    updateState((prevState: GameState) => {
      if (JSON.stringify(prevState) === JSON.stringify(gameData)) {
        return prevState;
      }
      return gameData;
    });
    return gameData;
  } catch (error) {
    // Optionally rethrow or handle error
    return undefined;
  }
}
