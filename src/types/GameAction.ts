import { ServerGame } from './ServerGame';

/**
 * Actions that can be sent to the server
 */
export type GameAction =
  | { type: 'CELL_CLICK'; payload: { cellKey: string } }
  | { type: 'PASS_TURN' }
  | { type: 'SEND_MESSAGE'; payload: { author: string; text: string } };

/**
 * Request body for POST /api/games/:gameId/action
 */
export interface ActionRequest {
  gameId: string;
  playerId: string;
  action: GameAction;
}

/**
 * Error codes returned by the server
 */
export type ActionErrorCode = 'INVALID_ACTION' | 'NOT_YOUR_TURN' | 'GAME_OVER' | 'UNAUTHORIZED';

/**
 * Response from POST /api/games/:gameId/action
 */
export interface ActionResponse {
  success: boolean;
  gameState?: ServerGame;
  error?: {
    code: ActionErrorCode;
    message: string;
  };
}
