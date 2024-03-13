export function canMovePiece(gameModel, piece, activePiece) {
  return gameModel.turnPlayer === piece.color && !activePiece && !piece.hasBall;
}
