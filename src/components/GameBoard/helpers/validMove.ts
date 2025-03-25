import { Piece } from '@/types/Piece';
import { getKeyCoordinates } from '../../../utils/gameUtilities';
import { Move } from '../../../types/Move'
export const validMove = (cellKey: string, possibleMoves: Move[], activePiece: Piece) => {
  const { row, col } = getKeyCoordinates(cellKey);
  const isLegalMove = possibleMoves.some((move) => move.row === row && move.col === col);
  if (!activePiece || !isLegalMove) {
    console.error('Illegal move or no piece selected.');
    return false;
  }
  return true;
};
