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
    newBoardStatus[targetKey] = { ...targetPiece, hasBall: true };
    newBoardStatus[sourceKey] = { ...sourcePiece, hasBall: false };
  } else {
    console.warn('Invalid passBall: one or both pieces are null');
  }

  return newBoardStatus;
};
