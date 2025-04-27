import type { Piece } from "@/../../../types/Piece'
export const canReceiveBall = (piece: Piece, possiblePasses: string[]) => {
  return possiblePasses.includes(piece.position);
};
