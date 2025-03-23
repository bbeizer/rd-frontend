import { clearSelection } from './clearSelection';
import { movePiece } from './movePiece';
export function returnPieceToOriginalSquare(state, toPosition) {
  state.currentBoardStatus = movePiece(
    state.movedPiece.position,
    toPosition,
    state.currentBoardStatus
  );
  state.movedPiece = null;
  state.originalSquare = null;
  state = clearSelection(state);

  return state;
}
