import { movePiece } from "./movePiece";

export function movePieceAndSetActivePiece(state, fromPosition, toPosition) {
    state.currentBoardStatus = movePiece(fromPosition, toPosition, state.currentBoardStatus);
    state.currentBoardStatus[toPosition].position = toPosition;
    state.movedPiece = state.currentBoardStatus[toPosition];
    state.originalSquare = fromPosition;
    state.possibleMoves = [state.originalSquare];
    state.activePiece = state.currentBoardStatus[toPosition];
  
    return state;
  }