import isEqual from 'lodash/isEqual';

export function canTogglePiece(piece, hasMoved, activePiece) {
    if (!activePiece) return true;
    if (hasMoved) {
        if (isEqual(piece, activePiece)) {
            return true;
        }
        if (piece.hasBall) {
            return true;
        }
        return false;
    }

    if (!hasMoved) {
        if (activePiece.hasBall && !isEqual(piece, activePiece)) {
            return false;
        }
        return true;
    }
    return false;
}
