export const movePiece = (sourceKey, targetKey, gameBoard) => {
  console.log(sourceKey);
  console.log(targetKey);
  const newBoardStatus = { ...gameBoard };
  const pieceToMove = newBoardStatus[sourceKey];
  newBoardStatus[targetKey] = pieceToMove;
  newBoardStatus[targetKey].position = targetKey;
  newBoardStatus[sourceKey] = null;
  return newBoardStatus;
};
