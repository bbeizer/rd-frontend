import isEqual from 'lodash/isEqual';

export function canTogglePiece(piece, hasMoved, activePiece) {
  if (activePiece) {
    if (isEqual(piece, activePiece)) {
      return true; // Allow deselecting the active piece
    }
    if (piece.hasBall) {
      return true; // Allow selecting the ball carrier
    }
    return false; // Do not allow toggling to a different piece
  }

  if (!hasMoved) {
    return true; // Allow selecting any piece if no move has been made
  }

  return false;
}

