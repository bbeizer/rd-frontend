    // keep track of piece color from the start of the function 
    // extend out from piece in all directions using a a loop. 
    // if piece can pass the ball to another piece of the same color 
    // without an opposing piece blocking it, then it is a legal pass
    import { getKeyCoordinates, toCellKey } from '../../../utils/gameUtilities'

    export const getValidPasses = (row, col, pieceColor, gameBoard) => {
        const directions = [
          { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, // Right, Left
          { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, // Down, Up
          { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, // Diagonal Down Right, Diagonal Up Right
          { dx: -1, dy: 1 }, { dx: -1, dy: -1 } // Diagonal Down Left, Diagonal Up Left
        ];
      
        const validPasses = [];
      
        directions.forEach(({ dx, dy }) => {
          let currentRow = row + dy;
          let currentCol = col + dx;
          
          while (currentRow >= 0 && currentRow < 8 && currentCol >= 0 && currentCol < 8) {
            const targetPosition = toCellKey(currentRow, currentCol);
            const targetPiece = gameBoard[targetPosition];
      
            // Stop extending if hit an opposing piece or edge of the board
            if (targetPiece) {
              // Check if it's a valid pass (same color, no ball)
              if (targetPiece.color === pieceColor && !targetPiece.hasBall) {
                validPasses.push(targetPosition);
              }
              break; // Stop looking further in this direction
            }
      
            currentRow += dy;
            currentCol += dx;
          }
        });
      
        return validPasses;
      };
      