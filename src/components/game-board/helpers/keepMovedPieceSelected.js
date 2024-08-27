export function keepMovedPieceSelected(state) {
    state.activePiece = state.movedPiece; // Ensure the moved piece stays selected
    state.possibleMoves = [state.originalSquare];
    console.log("Move not allowed, return piece to original position or pass the ball.");
  
    return state;
  }