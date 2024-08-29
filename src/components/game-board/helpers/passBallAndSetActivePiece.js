import { passBall } from './passBall';
import { getValidPasses } from './getValidPasses';

export function passBallAndSetActivePiece(state, element, cellKey) {
  state.gameData.currentBoardStatus = passBall(state.activePiece.position, cellKey, state.gameData.currentBoardStatus);
  state.activePiece = { ...element, hasBall: true };
  state.possiblePasses = getValidPasses(cellKey, element.color, state.gameData.currentBoardStatus);

  return state;
}