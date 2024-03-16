import React, { useState, useEffect } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves, legalMove } from '../../gameLogic/playerMovesRuleEngine';
import {canMovePiece, movePiece } from './helpers';

const GameBoard = ({ gameModel, pendingTurn, updateGameModel}) => {
  const [activePiece, setActivePiece] = useState(null);
  const [originalSquare, setOriginalSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameBoard, setGameBoard] = useState(gameModel.currentBoardStatus);
  const [hasMoved, setHasMoved] = useState(false);

  const setBoardState = (activePiece = null, possibleMoves = []) => {
    setActivePiece(activePiece);
    setPossibleMoves(possibleMoves);
  }

  useEffect(() => {
    setGameBoard(gameModel.currentBoardStatus);
  }, [gameModel.currentBoardStatus]);


  const handlePieceClick = (piece, cellKey) => {
    console.log("Piece Handler called", { activePiece, possibleMoves, cellKey });
    if (canMovePiece(gameModel, piece, activePiece)) {
      const { row, col } = getKeyCoordinates(cellKey);

      const moves = getPieceMoves(row, col, gameBoard, hasMoved, originalSquare); // Use the row and col derived from cellKey
      setBoardState({ ...piece, position: cellKey }, moves);
    }
  }

const handlePassTurn = () => {
    // Create a new object for the updated game model
    const updatedGameModel = {
        ...gameModel,
        turnPlayer: gameModel.turnPlayer === 'white' ? 'black' : 'white',
    };

    // Assuming updateGameModel can handle updating the entire game model or adjust as needed
    updateGameModel(updatedGameModel);
    setActivePiece(null);
    setHasMoved(false);
    setPossibleMoves([]);
    setOriginalSquare(null);
}

const handleCellClick = (cellKey) => {
  // Check if there's an active piece and the target cell is either empty or the original square
  if (!activePiece || (gameBoard[cellKey] && cellKey !== originalSquare)) {
    console.log("No active piece selected, cell is not empty, or move is not back to original square.");
    return;
  }

  const isReturningMove = cellKey === originalSquare;
  const isLegalMove = isReturningMove || (!hasMoved && legalMove(gameBoard, cellKey, possibleMoves));

  if (!isLegalMove) {
    console.log("Move is not legal");
    return;
  }

  // Proceed with the move
  const newBoardStatus = movePiece(activePiece.position, cellKey, gameBoard, activePiece.hasBall);

  // This assumes movePiece function correctly handles moving the piece and possibly transferring the ball.
  // The game model should include all relevant updates, including the turn player if necessary.
  const updatedGameModel = {
    ...gameModel,
    currentBoardStatus: newBoardStatus,
  };

  updateGameModel(updatedGameModel); // Communicate the updated game model to the parent component

  // Manage state based on the move
  if (isReturningMove) {
    // If the piece moved back to its original square, reset `hasMoved`
    setHasMoved(false);
  } else {
    // This is a new move, so mark as moved and set the original square if it's the first move
    setHasMoved(true);
    if (!originalSquare) setOriginalSquare(activePiece.position); // Only update if it's the first move
  }
  setBoardState();
};


  const renderBoard = () => {
    return Object.entries(gameBoard).map(([cellKey, cellData]) => {
      const { row, col } = getKeyCoordinates(cellKey);
      const piece = cellData ? (
        <Piece
          color={cellData.color}
          hasBall={cellData.hasBall}
          position={cellKey}
          onClick={() => handlePieceClick(cellData, cellKey)}
        />
      ) : null;
      const isPossibleMove = possibleMoves.some(move => {
        const moveKey = toCellKey(move.row, move.col);
        return cellKey === moveKey;
      });
      return <GridCell onClick={() => {handleCellClick(cellKey)}} key={cellKey} row={row} col={col} highlight={isPossibleMove}>{piece}</GridCell>;
    });
  };

  return (
    <>
      <GridContainer>{renderBoard()}</GridContainer>
      <br/>
      <button onClick={handlePassTurn}>Pass Turn</button>
    </>
  );
};

export default GameBoard;

/*
  Goal for this week:
  - getting the pieces to move so that once a piece move, the game knows the piece should go back to its initial square
  - one move at a time
  - integrating the ball, the pass ball functionality - at least starting that
*/