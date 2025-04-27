export type ServerGame = {
    _id: string;
    status: 'playing' | 'not started' | 'completed';
    gameType: 'single' | 'multiplayer';
    currentBoardStatus: Record<string, {
      color: string;
      hasBall: boolean;
      position: string;
    } | null>;
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
    aiColor: 'white' | 'black' | null;
    turnNumber: number;
    currentPlayerTurn: 'white' | 'black';
    moveHistory: Array<{
      turnNumber: number;
      black: string;
      white: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  