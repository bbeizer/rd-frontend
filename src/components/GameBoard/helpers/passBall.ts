import { Piece } from '@/types/Piece';

export const passBall = (
  sourceKey: string,
  targetKey: string,
  gameBoard: Record<string, Piece | null>
) => {
  const newBoardStatus = { ...gameBoard };
  const sourcePiece = newBoardStatus[sourceKey];
  const targetPiece = newBoardStatus[targetKey];

  if (sourcePiece && targetPiece) {
    newBoardStatus[sourceKey] = { ...sourcePiece, hasBall: false };
    newBoardStatus[targetKey] = { ...targetPiece, hasBall: true };
  }
  // else: do nothing if one or both pieces are null

  return newBoardStatus;
};
