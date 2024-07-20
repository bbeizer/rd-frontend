export const canMovePiece= (isUserTurn, playerColor, piece) => {
  if (!isUserTurn || piece.color !== playerColor) {
      console.log("It's not your turn or you've selected the wrong piece!");
      return false;
  }
  return true;
};
