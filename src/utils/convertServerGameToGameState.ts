import { ServerGame } from '../types/ServerGame';
import { GameState } from '../types/GameState';
import { Piece } from '../types/Piece';

export function convertServerGameToGameState(
  serverGame: ServerGame,
  playerColor: 'white' | 'black' | null = null
): GameState {
  const normalizedBoardStatus: Record<string, Piece | null> = {};

  for (const square in serverGame.currentBoardStatus) {
    const piece = serverGame.currentBoardStatus[square];

    if (piece) {
      normalizedBoardStatus[square] = {
        color: piece.color as 'white' | 'black',
        hasBall: piece.hasBall,
        position: piece.position,
      };
    } else {
      normalizedBoardStatus[square] = null;
    }
  }

  // Normalize activePiece to match Piece type
  const activePiece: Piece | null =
    serverGame.activePiece?.position && serverGame.activePiece?.color
      ? {
          position: serverGame.activePiece.position,
          color: serverGame.activePiece.color,
          hasBall: serverGame.activePiece.hasBall,
        }
      : null;

  // Normalize movedPiece - need to look it up from board to get full piece data
  const movedPiece: Piece | null = serverGame.movedPiece?.position
    ? (normalizedBoardStatus[serverGame.movedPiece.position] ?? null)
    : null;

  return {
    gameId: serverGame._id,
    gameType: serverGame.gameType,
    currentPlayerTurn: serverGame.currentPlayerTurn,
    activePiece,
    hasMoved: serverGame.hasMoved,
    possibleMoves: serverGame.possibleMoves,
    movedPiece,
    movedPieceOriginalPosition: serverGame.movedPiece?.position ?? null,
    possiblePasses: serverGame.possiblePasses,
    playerColor: playerColor,
    winner: serverGame.winner ?? null,
    whitePlayerName: serverGame.whitePlayerName || '',
    blackPlayerName: serverGame.blackPlayerName || '',
    currentBoardStatus: normalizedBoardStatus,
    originalSquare: serverGame.originalSquare ?? null,
    status: serverGame.status ?? 'not started',
    isUserTurn: undefined,
  };
}
