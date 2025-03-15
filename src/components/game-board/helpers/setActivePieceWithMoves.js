import { getPieceMoves } from './getPieceMoves';
import { isEqual } from 'lodash';

export function setActivePieceWithMoves(state, element, cellKey) {
  const selectedPieceIsMovedPiece = isEqual(state.movedPiece?.position, cellKey)
  if (selectedPieceIsMovedPiece) {
    // If the piece being selected is the moved piece, return to original square
    state.activePiece = state.movedPiece;
    state.possibleMoves = [state.originalSquare];
  } else {
    // Otherwise, set the active piece normally
    state.activePiece = { ...element, position: cellKey };
    state.possibleMoves = getPieceMoves(cellKey, state.currentBoardStatus);
  }

  return state;
}
