import { GameState } from '@/types/GameState';
import { getPieceMoves } from './getPieceMoves';
import { isEqual } from 'lodash';
import { Piece } from '@/types/Piece';
debugger
export function setActivePieceWithMoves(state: GameState, element: Piece, cellKey: string) {
  const selectedPieceIsMovedPiece =
  state.movedPiece && isEqual(state.movedPiece.position, cellKey);

if (selectedPieceIsMovedPiece) {
  // Return to original square
  state.activePiece = state.movedPiece;
  state.possibleMoves = state.originalSquare ? [state.originalSquare] : [];
} else {
  // Set new active piece + show its possible moves
  state.activePiece = { ...element, position: cellKey };
  state.possibleMoves = getPieceMoves(
    cellKey,
    state.currentBoardStatus,
    state.hasMoved,
    state.originalSquare ?? '' // fallback just in case
  );
}


  return state;
}
