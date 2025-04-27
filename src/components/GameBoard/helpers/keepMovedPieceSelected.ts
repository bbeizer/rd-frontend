import { GameState } from '@/types/GameState';

export function keepMovedPieceSelected(state: GameState) {
  state.activePiece = state.movedPiece; // Ensure the moved piece stays selected
  state.possibleMoves = state.originalSquare ? [state.originalSquare] : [];
  console.log('Move not allowed, return piece to original position or pass the ball.');

  return state;
}
