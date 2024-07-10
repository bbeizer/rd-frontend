export const passBall = (sourceKey, targetKey, gameBoard ) => {
  const newBoardStatus = { ...gameBoard };
  newBoardStatus[targetKey] = { ...newBoardStatus[targetKey], hasBall: true };
  newBoardStatus[sourceKey] = { ...newBoardStatus[sourceKey], hasBall: false };
  return newBoardStatus;
  };
  