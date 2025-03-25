import { Piece } from "@/types/Piece";

export const movePiece = (sourceKey: string, targetKey: string, gameBoard: Record<string, Piece | null>) => {
  console.log(sourceKey);
  console.log(targetKey);
  const newBoardStatus = { ...gameBoard };
  const pieceToMove = newBoardStatus[sourceKey];
  if (pieceToMove) {
    newBoardStatus[targetKey] = { ...pieceToMove, position: targetKey };
  }
  newBoardStatus[sourceKey] = null;
  newBoardStatus[targetKey] = pieceToMove;
  newBoardStatus[sourceKey] = null;
  return newBoardStatus;
};
