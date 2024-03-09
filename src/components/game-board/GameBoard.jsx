import React, { useState, useEffect } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import { getKeyCoordinates } from '../../utils/gameUtilities';
import { getPieceMoves } from '../../gameLogic/playerMovesRuleEngine';

const GameBoard = ({ gameModel, pendingMove }) => {
  const [activePiece, setActivePiece] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameBoard, setGameBoard] = useState(gameModel.currentBoardStatus);

  // If gameModel changes outside of this component, sync it with local state
  useEffect(() => {
    setGameBoard(gameModel.currentBoardStatus);
  }, [gameModel.currentBoardStatus]);

  const pieceClickHandler = (piece) => {
    if (gameModel.turnPlayer === piece.color && !piece.hasBall) {
      const moves = getPieceMoves(piece.position.row, piece.position.col, gameBoard);
      console.log(moves);
      setPossibleMoves(moves);
      setActivePiece(piece);
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
          onClick={() => pieceClickHandler({ ...cellData, position: { row, col } })}
        />
      ) : null;
      const isPossibleMove = possibleMoves.some(move => {
        const moveKey = `${String.fromCharCode(97 + move.col)}${move.row + 1}`;
        return cellKey === moveKey;
      });
      return <GridCell key={cellKey} row={row} col={col} highlight={isPossibleMove}>{piece}</GridCell>;
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
