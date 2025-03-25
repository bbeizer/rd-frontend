import { GameState } from "@/types/GameState";
import { Dispatch, SetStateAction } from "react";

export async function fetchGame(gameId: string, updateState: Dispatch<SetStateAction<GameState>>) {
  try {
    const baseUrl =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : import.meta.env.VITE_BACKEND_BASE_URL;
    const response = await fetch(`${baseUrl}/api/games/${gameId}`);
    if (!response.ok) {
      throw new Error(`Error fetching game: ${response.statusText}`);
    }
    const gameData = await response.json();
    updateState((prevState: GameState) => {
      if (JSON.stringify(prevState) === JSON.stringify(gameData)) {
        console.log('⚠️ No change in game data, skipping update.');
        return prevState;
      }
      console.log('✅ Updating game state with backend data.');
      return gameData;
    });
    return gameData;
  } catch (error) {
    console.error('❌ Error fetching game data:', error);
  }
}
