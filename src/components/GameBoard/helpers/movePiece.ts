import { Piece } from '@/types/Piece';

export const movePiece = (
  sourceKey: string,
  targetKey: string,
  gameBoard: Record<string, Piece | null>
) => {
  const newBoardStatus = { ...gameBoard };
  const pieceToMove = newBoardStatus[sourceKey];

  if (pieceToMove) {
    // Move the piece to the target position
    newBoardStatus[targetKey] = { ...pieceToMove, position: targetKey };
    // Clear the source position
    newBoardStatus[sourceKey] = null;
  }

  return newBoardStatus;
};
