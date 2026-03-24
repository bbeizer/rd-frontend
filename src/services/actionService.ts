import { apiClient } from './apiClient';
import { GameAction, ActionResponse, ActionErrorCode } from '@/types/GameAction';

/**
 * Send a game action to the server for validation and execution.
 * The server is the source of truth - it validates the action,
 * updates game state, and returns the authoritative result.
 */
export async function sendGameAction(
  gameId: string,
  playerId: string,
  action: GameAction
): Promise<ActionResponse> {
  try {
    const response = await apiClient.post<ActionResponse>(`/api/games/${gameId}/action`, {
      gameId,
      playerId,
      action,
    });
    return response.data;
  } catch (error) {
    // Handle network errors or unexpected server errors
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    // Check for axios error with response
    const axiosError = error as { response?: { data?: ActionResponse } };
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }

    return {
      success: false,
      error: {
        code: 'INVALID_ACTION' as ActionErrorCode,
        message,
      },
    };
  }
}
