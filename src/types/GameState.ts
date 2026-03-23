import { MessageProps } from '@/components/Message/Message';
import { Piece } from './Piece';

export type GameState = {
  gameId: string | undefined;
  gameType: string | null;
  currentPlayerTurn: string;
  activePiece: Piece | null;
  hasMoved: boolean;
  possibleMoves: string[];
  conversation?: MessageProps[];
  movedPiece: Piece | null;
  movedPieceOriginalPosition: string | null;
  possiblePasses: string[];
  aiColor?: string;
  playerColor: string | null;
  winner: string | null;
  whitePlayerName?: string;
  blackPlayerName?: string;
  currentBoardStatus: Record<string, Piece | null>;
  originalSquare: string | null;
  status?: string;
  isUserTurn?: boolean;
};
