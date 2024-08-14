
// const cellKey = event.currentTarget.id;
// const element = gameState.gameBoard[cellKey];
// const isPiece = !!element;  // Simplify the check to boolean
// const hasBall = element?.hasBall === "true";
// const { row, col } = getKeyCoordinates(cellKey);
// const pieceColor = element?.color;

// input state:
/*
elementClicked = gameState.gameBoard[cellKey];
currentGameBoard = gameState.gameBoard;
{
  elementClicked,
  currentGameBoard
}
*/

// output state:
/*
{
  activePiece
  possiblePasses
  possibleMoves
  gameBoard
  movedPiece
  originalSquare
}
*/

export const handleClick = (cellKeyClicked, currentGameState) => {
  return {
    activePiece: null,
    possiblePasses: [],//getValidPasses(row, col, pieceColor, currentGameBoard),
    possibleMoves: [],//getPieceMoves(row, col, currentGameBoard),
    gameBoard: currentGameState.gameBoard,
    movedPiece: null,
    originalSquare: null
  }
}





// TODO: rewrite this function to use the input state and output state

// export function updateGameState(prevState) {
//   const isFirstClickOnPiece = !prevState.movedPiece && !prevState.activePiece;
//   const unselectingASelectedPiece = prevState.activePiece && element === prevState.activePiece;
//   const selectingPieceThatIsNotActivePiece = prevState.activePiece && element !== prevState.activePiece;
//   const activePieceHasBall = prevState.activePiece?.hasBall;
//   const noPieceHasMovedAndMoveIsValid = !prevState.movedPiece && includesCoordinates(prevState.possibleMoves, {row,col})
//   const aPieceHasMoved = !!prevState.movedPiece;
//   const isReturningToOriginalSquare = cellKey === prevState.originalSquare && includesCoordinates(prevState.possibleMoves, {row,col})
//   const noActivePiece = !prevState.activePiece

//   let newState = { ...prevState };

//   if (isPiece) {
//       if (hasBall) {
//           newState.activePiece = { ...element, position: cellKey };
//           newState.possiblePasses = getValidPasses(row, col, pieceColor, prevState.gameBoard);
//       } else if (isFirstClickOnPiece) {
//         newState.activePiece = { ...element, position: cellKey };
//           newState.possibleMoves = getPieceMoves(row, col, prevState.gameBoard);
//       } else if (unselectingASelectedPiece) {
//           newState.activePiece = null;
//           newState.possibleMoves = [];
//       } else if (selectingPieceThatIsNotActivePiece) {
//           if (activePieceHasBall) {
//               newState.gameBoard = passBall();
//               didWin(gameState.gameBoard);
//               newState.possiblePasses = getValidPasses(row, col, pieceColor, prevState.gameBoard);
//           }
//           newState.activePiece = { ...element, position: cellKey };
//           newState.possibleMoves = getPieceMoves(row, col, prevState.gameBoard);
//       }
//   } else {
//       if (noActivePiece) {
//           console.log("No piece selected, please select a piece.");
//           newState.activePiece = null;
//           newState.possibleMoves = [];
//       } else if (prevState.activePiece) {
//           if (activePieceHasBall) {
//               newState.activePiece = null;
//               newState.possibleMoves = [];
//           } else if (noPieceHasMovedAndMoveIsValid) {
//               newState.gameBoard = movePiece(prevState.activePiece.position, cellKey, prevState.gameBoard);
//               newState.movedPiece = prevState.activePiece;
//               newState.originalSquare = prevState.activePiece.position;
//               newState.possibleMoves = [prevState.activePiece.position];
//           } else if (aPieceHasMoved) {
//               if (isReturningToOriginalSquare) {
//                   newState.gameBoard = movePiece(prevState.movedPiece.position, cellKey, prevState.gameBoard);
//                   newState.movedPiece = null;
//                   newState.originalSquare = null;
//                   newState.possibleMoves = [];
//               } else {
//                   console.log("Move not allowed, return piece to original position or pass the ball.");
//               }
//           } else {
//               console.log("Invalid operation.");
//               newState.activePiece = null;
//               newState.possibleMoves = [];
//               newState.possiblePasses = [];
//           }
//       }
//   }
//   return newState;
// }