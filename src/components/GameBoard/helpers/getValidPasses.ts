import { Piece } from '@/types/Piece';
import { getKeyCoordinates, toCellKey } from '../../../utils/gameUtilities';
export const getValidPasses = (cellKey: string, pieceColor: string, gameBoard: Record<string, Piece | null>) => {
  const { row, col } = getKeyCoordinates(cellKey);
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 }, // Right, Left
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }, // Down, Up
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 }, // Diagonal Down Right, Diagonal Up Right
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 }, // Diagonal Down Left, Diagonal Up Left
  ];

  const validPasses: string[] = [];

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
