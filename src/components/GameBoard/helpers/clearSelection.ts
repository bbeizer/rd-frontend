export function clearSelection(state) {
  state.activePiece = null;
  state.possibleMoves = [];
  state.possiblePasses = [];
  return state;
}
