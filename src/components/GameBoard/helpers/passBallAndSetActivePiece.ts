import { passBall } from './passBall';
import { getValidPasses } from './getValidPasses';
import { GameState } from '@/types/GameState';
import { Piece } from '@/types/Piece';

export function passBallAndSetActivePiece(state: GameState, element: Piece, cellKey: string) {
  if (!state.activePiece) return state;

  state.currentBoardStatus = passBall(
    state.activePiece.position,
    cellKey,
    state.currentBoardStatus
  );
  state.activePiece = { ...element, hasBall: true };
  state.possiblePasses = getValidPasses(cellKey, element.color, state.currentBoardStatus);

  return state;
}
