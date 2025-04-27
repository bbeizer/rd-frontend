import { apiPost, apiClient } from './apiClient';
import { ApiResponse } from '../types/ApiResponse';
import { ServerGame } from '@/types/ServerGame';

const baseUrl =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : import.meta.env.VITE_BACKEND_BASE_URL;

if (!baseUrl) {
  console.error('⚠️ VITE_BACKEND_BASE_URL is not set! Check your .env file.');
}

export const joinMultiplayerQueue = async (playerId: string, playerName: string) => {
  return apiPost('/api/games/joinMultiplayerGame', { playerId, playerName });
};

export const startSinglePlayerGame = async <T = any>(
  userId: string,
  userName: string,
  userColor: string
) => {
  return apiPost<T>('/api/games/startSinglePlayerGame', {
    playerId: userId,
    playerName: userName,
    playerColor: userColor,
  });
};

export const getGameById = async (id: string): Promise<ServerGame> => {
  const response = await apiClient<ServerGame>(`/api/games/${id}`);
  return response.data;
};

export const updateGame = async <T>(gameId: string, gameData: any): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData),
    });

    return { success: true, data: response as T };
  } catch (error: any) {
    console.error('Could not update game:', error.message);
    return { success: false, error: error.message };
  }
};
