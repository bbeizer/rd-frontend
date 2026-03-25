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

export interface RematchResponse {
  rematchGameId?: string;
  game?: ServerGame;
  message?: string;
  whiteWantsRematch?: boolean;
  blackWantsRematch?: boolean;
}

export const requestRematch = async (
  gameId: string,
  playerId: string
): Promise<ApiResponse<RematchResponse>> => {
  try {
    const response = await apiClient.post<RematchResponse>(`/api/games/${gameId}/rematch`, {
      playerId,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Could not request rematch:', message);
    return { success: false, error: message };
  }
};

export const declineRematch = async (
  gameId: string,
  playerId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/api/games/${gameId}/rematch`, {
      data: { playerId },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Could not decline rematch:', message);
    return { success: false, error: message };
  }
};
