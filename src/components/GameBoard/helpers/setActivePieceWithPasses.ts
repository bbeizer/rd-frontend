import { GameState } from '@/types/GameState';
import { getValidPasses } from './getValidPasses';
import { Piece } from '@/types/Piece';

export function setActivePieceWithPasses(state: GameState, element: Piece, cellKey: string) {
  state.activePiece = { ...element, position: cellKey };
  state.possiblePasses = getValidPasses(cellKey, element.color, state.currentBoardStatus);
  return state;
}
