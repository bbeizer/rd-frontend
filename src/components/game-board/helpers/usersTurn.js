export const usersTurn = (isUserTurn) => {
  if (!isUserTurn) {
    console.log("It's not your turn or you've selected the wrong piece!");
    return false;
  }
  return true;
};