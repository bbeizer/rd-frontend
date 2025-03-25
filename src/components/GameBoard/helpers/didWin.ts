// if white has a piece with the ball on the back row, or if black has a piece on the front row

import { Piece } from "@/types/Piece";

// with the ball then someone has won
export const didWin = (gameBoard: Record<string, Piece | null>) => {
  //console.log("did win hit")
  if (!gameBoard) {
    return false; // Assuming the game is not won if the board is not loaded
  } else {
    const oneArray = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'];
    const eightArray = ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];
    for (var i = 0; i < 8; i++) {
      if (gameBoard[oneArray[i]]) {
        if (gameBoard[oneArray[i]]!.hasBall && gameBoard[oneArray[i]]!.color === 'black') {
          return true;
        }
      }
      if (gameBoard[eightArray[i]]) {
        if (gameBoard[eightArray[i]]!.hasBall && gameBoard[eightArray[i]]!.color === 'white') {
          return true;
        }
      }
    }
    return false;
  }
};
