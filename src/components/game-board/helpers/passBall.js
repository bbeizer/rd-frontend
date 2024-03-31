export const passBall = (sourceKey, targetKey, gameBoard ) => {
    console.log(sourceKey)
    console.log(targetKey)
    const newBoardStatus = { ...gameBoard };
    const piecewithBall = newBoardStatus[sourceKey];
    if (canPassBall(piecewithBall, gameBoard)){
        newBoardStatus[targetKey].hasBall = true
        newBoardStatus[sourceKey].hasBall = false;
       }
    return newBoardStatus;
  };
  