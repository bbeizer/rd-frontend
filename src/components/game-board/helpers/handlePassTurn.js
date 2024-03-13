export const handlePassTurn = (gameModel) => {
  gameModel.turnPlayer = gameModel.turnPlayer === 'white' ? 'black' : 'white';
};