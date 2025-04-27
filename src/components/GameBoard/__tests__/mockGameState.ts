import type { GameState } from '@/types/GameState';

export const initialGameState = (): GameState => {
  const board: Record<string, any> = {};

  const files = 'abcdefgh';
  for (const file of files) {
    for (let rank = 1; rank <= 8; rank++) {
      const key = `${file}${rank}`;
      board[key] = null;
    }
  }

  // Add your starting pieces
  board['e1'] = { color: 'white', hasBall: false, position: 'e1' };
  board['f1'] = { color: 'white', hasBall: false, position: 'f1' };
  board['d1'] = { color: 'white', hasBall: true, position: 'd1' };
  board['c8'] = { color: 'black', hasBall: false, position: 'c8' };
  board['d8'] = { color: 'black', hasBall: false, position: 'd8' };
  board['e8'] = { color: 'black', hasBall: true, position: 'e8' };
  board['f8'] = { color: 'black', hasBall: false, position: 'f8' };

  return {
    gameId: 'test-game-id',
    gameType: 'singleplayer',
    currentPlayerTurn: 'white',
    activePiece: null,
    possibleMoves: [],
    hasMoved: false,
    movedPiece: null,
    movedPieceOriginalPosition: null,
    possiblePasses: [],
    playerColor: 'white',
    originalSquare: null,
    winner: null,
    whitePlayerName: 'TestWhite',
    blackPlayerName: 'TestBlack',
    isUserTurn: true,
    currentBoardStatus: board,
  };
};
