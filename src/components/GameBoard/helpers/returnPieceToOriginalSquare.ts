import { GameState } from '@/types/GameState';
import { clearSelection } from './clearSelection';
import { movePiece } from './movePiece';
export function returnPieceToOriginalSquare(state: GameState, toPosition: string) {
  if (!state.movedPiece) return state;

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
