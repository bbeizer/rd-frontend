import { clearSelection } from './clearSelection';
import { setActivePieceWithPasses } from './setActivePieceWithPasses';
import { setActivePieceWithMoves } from './setActivePieceWithMoves';
import { passBallAndSetActivePiece } from './passBallAndSetActivePiece';
import { movePieceAndSetActivePiece } from './movePieceAndSetActivePiece';
import { returnPieceToOriginalSquare } from './returnPieceToOriginalSquare';
import { keepMovedPieceSelected } from './keepMovedPieceSelected';
import { includesCoordinates } from './includesCoordinates';
import isEqual from 'lodash/isEqual';
import { canReceiveBall } from './canReceiveBall';
import { didWin } from './didWin';
import { clickedOnWrongPiece } from './clickedOnWrongPiece';
import { GameState } from '@/types/GameState';

export function updateGameState(cellKey: string, gameState: GameState) {
  const playerColor = localStorage.getItem('userColor');
  const isUserTurn = gameState.currentPlayerTurn === playerColor!;
  const element = gameState.currentBoardStatus[cellKey];
  const clickedOnPiece = !!element;
  const pieceHasBall = element?.hasBall;
  const unselectingASelectedPiece =
    gameState.activePiece && isEqual(element, gameState.activePiece);
  const reselectingTheMovedPiece = isEqual(gameState.movedPiece?.position, element?.position);
  const activePieceHasBall = gameState.activePiece?.hasBall;
  const noPieceHasMovedAndMoveIsValid =
    !gameState.movedPiece && includesCoordinates(gameState.possibleMoves, cellKey);
  const aPieceHasMoved = !!gameState.movedPiece;
  const isReturningToOriginalSquare =
    cellKey === gameState.originalSquare && includesCoordinates(gameState.possibleMoves, cellKey);
  const noActivePiece = !gameState.activePiece;

  let newState = { ...gameState };
  if (!isUserTurn) return gameState;
  // Clicked on a piece
  if (clickedOnPiece) {
    if (clickedOnWrongPiece(element.color, playerColor)) {
      return gameState;
    }
    if (
      aPieceHasMoved &&
      !activePieceHasBall &&
      !isEqual(element, gameState.movedPiece) &&
      !pieceHasBall &&
      !unselectingASelectedPiece &&
      !reselectingTheMovedPiece
    ) {
      return gameState;
    }
    if (pieceHasBall) {
      if (unselectingASelectedPiece) {
        newState = clearSelection(newState);
      } else {
        newState = setActivePieceWithPasses(newState, element, cellKey);
      }
    } else {
      if (activePieceHasBall) {
        if (canReceiveBall(element, gameState.possiblePasses)) {
          newState = passBallAndSetActivePiece(newState, element, cellKey);
          if (didWin(newState.currentBoardStatus)) {
            newState.winner =
              newState.currentPlayerTurn === 'white'
                ? (newState.whitePlayerName ?? null)
                : (newState.blackPlayerName ?? null);
            return newState;
          }
        }
      } else {
        if (unselectingASelectedPiece) {
          newState = clearSelection(newState);
        } else {
          newState = setActivePieceWithMoves(newState, element, cellKey);
        }
      }
    }
  } else {
    if (noActivePiece) {
      newState = clearSelection(newState);
    } else if (gameState.activePiece) {
      if (activePieceHasBall) {
        newState = clearSelection(newState);
      } else if (noPieceHasMovedAndMoveIsValid) {
        newState = movePieceAndSetActivePiece(newState, gameState.activePiece.position, cellKey);
        newState.hasMoved = true;
      } else if (aPieceHasMoved) {
        if (isReturningToOriginalSquare) {
          newState = returnPieceToOriginalSquare(newState, cellKey);
          newState.hasMoved = false;
        } else {
          newState = keepMovedPieceSelected(newState);
        }
      } else {
        newState = clearSelection(newState);
      }
    }
  }

  return newState;
}
