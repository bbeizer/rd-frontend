import { GameState } from "@/../../../types/GameState'
export function clearSelection(state: GameState) {
  state.activePiece = null;
  state.possibleMoves = [];
  state.possiblePasses = [];
  return state;
}
