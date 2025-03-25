import { GameState } from '@/types/GameState';
import { getPieceMoves } from './getPieceMoves';
import { isEqual } from 'lodash';
import { Piece } from '@/types/Piece';

export function setActivePieceWithMoves(state: GameState, element: Piece, cellKey: string) {
  const selectedPieceIsMovedPiece = isEqual(state.movedPiece?.position, cellKey);
  if (selectedPieceIsMovedPiece) {
    // If the piece being selected is the moved piece, return to original square
    state.activePiece = state.movedPiece;
    state.possibleMoves = state.originalSquare ? [state.originalSquare] : [];
  } else {
    // Otherwise, set the active piece normally
    state.activePiece = { ...element, position: cellKey };
    state.possibleMoves = state.currentBoardStatus && state.originalSquare
  ? getPieceMoves(cellKey, state.currentBoardStatus, state.hasMoved, state.originalSquare)
  : [];
  }

  return state;
}
