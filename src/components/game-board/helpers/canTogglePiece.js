import isEqual from 'lodash/isEqual';

export function canTogglePiece(piece, hasMoved, activePiece){
    // Allow toggling if no move has been made yet
    if (!hasMoved) return true;

    // If a move has been made, check if the piece being toggled is the one that moved
    if (isEqual(piece, activePiece)) {
        return true;
    }

    // Otherwise, disallow toggling any other pieces
    return false;
}