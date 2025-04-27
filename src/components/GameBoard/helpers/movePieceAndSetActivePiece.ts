import { GameState } from '@/types/GameState';
import { movePiece } from './movePiece';

export function movePieceAndSetActivePiece(
  state: GameState,
  fromPosition: string,
  toPosition: string
) {
  state.currentBoardStatus = movePiece(fromPosition, toPosition, state.currentBoardStatus);
  const moved = state.currentBoardStatus[toPosition];
  if (moved) {
    moved.position = toPosition;
    state.movedPiece = moved;
    state.activePiece = moved;
  }
  state.originalSquare = fromPosition;
  state.possibleMoves = [state.originalSquare];

  return state;
}
