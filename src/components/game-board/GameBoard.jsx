import React, { useState, useEffect } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves, legalMove } from '../../gameLogic/playerMovesRuleEngine';
import { handlePassTurn, canMovePiece, movePiece } from './helpers';

const GameBoard = ({ gameModel, pendingMove, updateGameModel}) => {
  const [activePiece, setActivePiece] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameBoard, setGameBoard] = useState(gameModel.currentBoardStatus);

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
      // Assuming getKeyCoordinates converts cellKey ('e8') back to { row, col }
      const { row, col } = getKeyCoordinates(cellKey);

      const moves = getPieceMoves(row, col, gameBoard); // Use the row and col derived from cellKey
      setBoardState({ ...piece, position: cellKey }, moves);
    }
  }

  const handleCellClick = (cellKey) => {
    if(gameBoard[cellKey]=== null && activePiece){
      if (legalMove(gameBoard, cellKey, possibleMoves)) {
        const newBoardStatus = movePiece(activePiece.position, cellKey, gameBoard)
        updateGameModel(newBoardStatus);
        setBoardState();
      } else {
        console.log("Move is not legal");
        // Optionally, reset activePiece and possibleMoves here or handle as needed
      }
    }
  }

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
      <button onClick={() => {handlePassTurn(gameModel)}}>Pass Turn</button>
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