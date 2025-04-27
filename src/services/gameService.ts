import { apiPost, apiClient } from './apiClient';
import { ApiResponse } from '../types/ApiResponse';
import { ServerGame } from '@/types/ServerGame';

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
  const response = await apiClient.get<ServerGame>(`/api/games/${id}`);
  return response.data;
};

export const updateGame = async <T>(gameId: string, gameData: any): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.patch<T>(`/api/games/${gameId}`, gameData);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Could not update game:', error.message);
    return { success: false, error: error.message };
  }
};
