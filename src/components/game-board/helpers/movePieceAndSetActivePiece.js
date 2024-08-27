import { movePiece } from "./movePiece";

export function movePieceAndSetActivePiece(state, fromPosition, toPosition) {
    state.gameData.currentBoardStatus = movePiece(fromPosition, toPosition, state.gameData.currentBoardStatus);
    state.gameData.currentBoardStatus[toPosition].position = toPosition;
    state.movedPiece = state.gameData.currentBoardStatus[toPosition];
    state.originalSquare = fromPosition;
    state.possibleMoves = [state.originalSquare];
    state.activePiece = state.gameData.currentBoardStatus[toPosition];
  
    return state;
  }