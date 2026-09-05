import { MoveHistoryEntry } from './GameSummary';

export type ServerGame = {
  _id: string;
  status: 'playing' | 'not started' | 'completed';
  gameType: 'singleplayer' | 'multiplayer';
  currentBoardStatus: Record<
    string,
    {
      color: string;
      hasBall: boolean;
      position: string;
    } | null
  >;
  possibleMoves: string[];
  possiblePasses: string[];
  winner: string | null;
  activePiece: {
    position: string | null;
    color?: 'black' | 'white';
    hasBall: boolean;
  };
  movedPiece: {
    position: string;
  };
  hasMoved: boolean;
  originalSquare: string | null;
  whitePlayerId?: string;
  blackPlayerId?: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'impossible';
  aiColor: 'white' | 'black' | null;
  turnNumber: number;
  currentPlayerTurn: 'white' | 'black';
  moveHistory: MoveHistoryEntry[];
  whiteWantsRematch?: boolean;
  blackWantsRematch?: boolean;
  rematchGameId?: string;
  createdAt: string;
  updatedAt: string;
};
