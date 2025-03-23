import { getKeyCoordinates } from '../../../utils/gameUtilities';
export const validMove = (cellKey, possibleMoves, activePiece) => {
  const { row, col } = getKeyCoordinates(cellKey);
  const isLegalMove = possibleMoves.some((move) => move.row === row && move.col === col);
  if (!activePiece || !isLegalMove) {
    console.error('Illegal move or no piece selected.');
    return false;
  }
  return true;
};
