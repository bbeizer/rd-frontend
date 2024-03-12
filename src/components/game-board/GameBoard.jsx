import React, { useState, useEffect } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves, legalMove } from '../../gameLogic/playerMovesRuleEngine';

const GameBoard = ({ gameModel, pendingMove, updateGameModel}) => {
  const [activePiece, setActivePiece] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameBoard, setGameBoard] = useState(gameModel.currentBoardStatus);

  useEffect(() => {
    setGameBoard(gameModel.currentBoardStatus);
  }, [gameModel.currentBoardStatus]);

  const pieceClickHandler = (piece, cellKey) => {
    console.log("Handler called", { activePiece, possibleMoves, cellKey });
  
    // Assuming getKeyCoordinates converts cellKey ('e8') back to { row, col }
    const { row, col } = getKeyCoordinates(cellKey);
  
    if (gameModel.turnPlayer === piece.color && !activePiece && !piece.hasBall) {
      const moves = getPieceMoves(row, col, gameBoard); // Use the row and col derived from cellKey
      setPossibleMoves(moves);
      setActivePiece({ ...piece, position: cellKey }); // Now position is correctly set as cellKey
    }
  };
  

  const cellClickHandler = (cellKey) => {
      console.log(activePiece)
      if(gameBoard[cellKey]=== null && activePiece){
        movePiece(activePiece.position, cellKey)
      }

  };

  const movePiece = (sourceKey, targetKey) => {
    console.log(sourceKey)
    console.log(targetKey)
    if (legalMove(gameBoard, targetKey, possibleMoves)) {
      const newBoardStatus = { ...gameBoard };
      const pieceToMove = newBoardStatus[sourceKey];
      newBoardStatus[targetKey] = pieceToMove;
      newBoardStatus[sourceKey] = null;
      updateGameModel(newBoardStatus); // Sync with the global game state
  
      setActivePiece(null);
      setPossibleMoves([]);
    } else {
      console.log("Move is not legal");
      // Optionally, reset activePiece and possibleMoves here or handle as needed
    }
  };
  
  const handlePassTurn = () => {
    gameModel.turnPlayer = gameModel.turnPlayer === 'white' ? 'black' : 'white';
  };

  const renderBoard = () => {
    return Object.entries(gameBoard).map(([cellKey, cellData]) => {
      const { row, col } = getKeyCoordinates(cellKey);
      const piece = cellData ? (
        <Piece
          color={cellData.color}
          hasBall={cellData.hasBall}
          position={cellKey}
          onClick={() => pieceClickHandler(cellData, cellKey)}
        />
      ) : null;
      const isPossibleMove = possibleMoves.some(move => {
        const moveKey = toCellKey(move.row, move.col);
        return cellKey === moveKey;
      });
      return <GridCell onClick={() => cellClickHandler(cellKey)} key={cellKey} row={row} col={col} highlight={isPossibleMove}>{piece}</GridCell>;
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
