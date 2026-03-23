import { apiPost, apiClient } from './apiClient';
import { ApiResponse } from '../types/ApiResponse';
import { ServerGame } from '@/types/ServerGame';
import { StartSinglePlayerResponse } from '@/types/StartSinglePlayerResponse';

export const joinMultiplayerQueue = async (playerId: string, playerName: string) => {
  return apiPost('/api/games/joinMultiplayerGame', { playerId, playerName });
};

export const startSinglePlayerGame = async (
  userId: string,
  userName: string,
  userColor: string
) => {
  return apiPost<StartSinglePlayerResponse>('/api/games/startSinglePlayerGame', {
    playerId: userId,
    playerName: userName,
    playerColor: userColor,
  });
};

export const getGameById = async (id: string): Promise<ServerGame> => {
  const response = await apiClient.get<ServerGame>(`/api/games/${id}`);
  return response.data;
};

export const updateGame = async (
  gameId: string,
  gameData: Record<string, unknown>
): Promise<ApiResponse<ServerGame>> => {
  try {
    const response = await apiClient.patch<ServerGame>(`/api/games/${gameId}`, gameData);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Could not update game:', message);
    return { success: false, error: message };
  }
};
