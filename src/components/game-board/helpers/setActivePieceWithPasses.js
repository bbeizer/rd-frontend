import { getValidPasses } from './getValidPasses';

export function setActivePieceWithPasses(state, element, cellKey) {
  state.activePiece = { ...element, position: cellKey };
  state.possiblePasses = getValidPasses(cellKey, element.color, state.currentBoardStatus);
  return state;
}