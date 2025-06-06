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
  console.log('cell key...');
  console.log(cellKey);
  console.log('gameState...');
  console.log(gameState);
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
      console.log("You cannot select your opponent's piece.");
      return gameState;
    }
    // Case 1: A piece has moved and the active piece does not have the ball
    console.log(`a PieceHasMoved...  ${aPieceHasMoved}`);
    console.log(`activePieceHasBall ${activePieceHasBall}`);
    console.log(`element... ${element}`);
    console.log(`piece hasBall... ${pieceHasBall}`);
    console.log(`unselectingASelectedPiece.. ${unselectingASelectedPiece}`);
    if (
      aPieceHasMoved &&
      !activePieceHasBall &&
      !isEqual(element, gameState.movedPiece) &&
      !pieceHasBall &&
      !unselectingASelectedPiece &&
      !reselectingTheMovedPiece
    ) {
      console.log(
        'You can only select the piece that has already moved or the piece with the ball.'
      );
      return gameState;
    }
    // Case 2: The piece being clicked has the ball
    if (pieceHasBall) {
      if (unselectingASelectedPiece) {
        newState = clearSelection(newState);
      } else {
        newState = setActivePieceWithPasses(newState, element, cellKey);
      }
    } else {
      // Case 3: Active piece has the ball, try to pass it
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
        } else {
          console.log('Pass not allowed.');
        }
      } else {
        // Case 4: No ball is involved, just a regular move
        if (unselectingASelectedPiece) {
          newState = clearSelection(newState);
        } else {
          newState = setActivePieceWithMoves(newState, element, cellKey);
        }
      }
    }

    // Clicked on a square
  } else {
    if (noActivePiece) {
      console.log('No piece selected, please select a piece.');
      newState = clearSelection(newState);
    } else if (gameState.activePiece) {
      // Case 5: Handle movement and return to original square logic
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
        console.log('Invalid operation.');
        newState = clearSelection(newState);
      }
    }
  }

  return newState;
}
