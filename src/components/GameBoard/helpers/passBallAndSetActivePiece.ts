import { passBall } from './passBall';
import { getValidPasses } from './getValidPasses';

export function passBallAndSetActivePiece(state, element, cellKey) {
  state.currentBoardStatus = passBall(
    state.activePiece.position,
    cellKey,
    state.currentBoardStatus
  );
  state.activePiece = { ...element, hasBall: true };
  state.possiblePasses = getValidPasses(cellKey, element.color, state.currentBoardStatus);

  return state;
}
