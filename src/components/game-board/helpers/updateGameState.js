import { getPieceMoves } from "./getPieceMoves";
import { getValidPasses } from "./getValidPasses";
import { passBall } from "./passBall";
import { includesCoordinates } from "./includesCoordinates";
import { didWin } from "./didWin";
import { movePiece } from "./movePiece";
import isEqual from 'lodash/isEqual';
import { usersTurn} from './usersTurn'
import {canReceiveBall} from './canReceiveBall'

export function updateGameState(cellKey, gameState) {
  const element = gameState.gameData.currentBoardStatus[cellKey]
  const clickedOnPiece = !!element;  // Simplify the check to boolean
  const pieceHasBall = element?.hasBall;
  const pieceColor = element?.color;
  const isFirstClickOnPiece = !gameState.movedPiece && !gameState.activePiece;
  const unselectingASelectedPiece = gameState.activePiece && isEqual(element, gameState.activePiece)
  const selectingPieceThatIsNotActivePiece = gameState.activePiece && element !== gameState.activePiece;
  const activePieceHasBall = gameState.activePiece?.hasBall;
  const noPieceHasMovedAndMoveIsValid = !gameState.movedPiece && includesCoordinates(gameState.possibleMoves, cellKey)
  const aPieceHasMoved = !!gameState.movedPiece;
  const isReturningToOriginalSquare = cellKey === gameState.originalSquare && includesCoordinates(gameState.possibleMoves, cellKey)
  const noActivePiece = !gameState.activePiece

  let newState = { ...gameState };
  if (!usersTurn(newState.isUserTurn)) return gameState;
  if (clickedOnPiece) {
      if (pieceHasBall) {
          newState.activePiece = { ...element, position: cellKey };
          newState.possiblePasses = getValidPasses(cellKey, pieceColor, gameState.gameData.currentBoardStatus);
      } else if (isFirstClickOnPiece) {
        newState.activePiece = { ...element, position: cellKey };
          newState.possibleMoves = getPieceMoves(cellKey, gameState.gameData.currentBoardStatus);
      } else if (unselectingASelectedPiece) {
          newState.activePiece = null;
          newState.possibleMoves = [];
      } else if (selectingPieceThatIsNotActivePiece) {
          if (activePieceHasBall) {
              if(canReceiveBall(element, gameState.possiblePasses)){
                newState.gameData.currentBoardStatus = passBall(newState.activePiece.position, element.position, gameState.gameData.currentBoardStatus);
                newState.activePiece = element
                newState.activePiece.hasBall = true
                newState.possiblePasses = getValidPasses(cellKey, pieceColor, gameState.gameData.currentBoardStatus);    
                    if (didWin(gameState.gameData.currentBoardStatus)){
                        newState.winner = true;
                        return newState;
                    }
              }
          } else {
                newState.activePiece = element
                getPieceMoves(cellKey, gameState.gameData.currentBoardStatus);
          }
      }
  } else {
      if (noActivePiece) {
          console.log("No piece selected, please select a piece.");
          newState.activePiece = null;
          newState.possibleMoves = [];
      } else if (gameState.activePiece) {
          if (activePieceHasBall) {
              newState.activePiece = null;
              newState.possibleMoves = [];
          } else if (noPieceHasMovedAndMoveIsValid) {
              newState.gameData.currentBoardStatus = movePiece(gameState.activePiece.position, cellKey, gameState.gameData.currentBoardStatus);
              newState.gameData.currentBoardStatus[cellKey].position = cellKey
              newState.movedPiece = newState.gameData.currentBoardStatus[cellKey]
              newState.originalSquare = gameState.activePiece.position;
              newState.possibleMoves = newState.originalSquare
              newState.activePiece = gameState.gameData.currentBoardStatus[cellKey]

          } else if (aPieceHasMoved) {
              if (isReturningToOriginalSquare) {
                  newState.gameData.currentBoardStatus= movePiece(gameState.movedPiece.position, cellKey, gameState.gameData.currentBoardStatus);
                  newState.movedPiece = null;
                  newState.originalSquare = null;
                  newState.activePiece = null
                  newState.possibleMoves = []

              } else {
                  console.log("Move not allowed, return piece to original position or pass the ball.");
              }
          } else {
              console.log("Invalid operation.");
              newState.activePiece = null;
              newState.possibleMoves = [];
              newState.possiblePasses = [];
          }
      }
  }
  return newState;
}