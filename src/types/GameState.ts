export type GameState = {
  gameId: string | undefined;
  gameType: string | null;
  currentPlayerTurn: string;
  activePiece: any;
  possibleMoves: string[];
  movedPiece: any;
  movedPieceOriginalPosition: any;
  possiblePasses: string[];
  playerColor: string | null;
  winner: string | null;
  whitePlayerName?: string;
  blackPlayerName?: string;
  currentBoardStatus?: Record<string, any>;
  status?: string;
  isUserTurn?: boolean;
};
