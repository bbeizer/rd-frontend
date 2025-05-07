import { MessageProps } from '@/components/Message/Message';
import { Piece } from './Piece';

export type GameState = {
  gameId: string | undefined;
  gameType: string | null;
  currentPlayerTurn: string;
  activePiece: any;
  hasMoved: boolean;
  possibleMoves: string[];
  conversation?: MessageProps[];
  movedPiece: any;
  movedPieceOriginalPosition: any;
  possiblePasses: string[];
  playerColor: string | null;
  winner: string | null;
  whitePlayerName?: string;
  blackPlayerName?: string;
  currentBoardStatus: Record<string, Piece | null>;
  originalSquare: string | null;
  status?: string;
  isUserTurn?: boolean;
};
