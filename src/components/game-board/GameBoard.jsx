import React, { useState, useEffect } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves, legalMove } from '../../gameLogic/playerMovesRuleEngine';
import { canMovePiece, movePiece } from './helpers';

const GameBoard = ({ gameModel, updateGameModel }) => {
  const [activePiece, setActivePiece] = useState(null);
  const [originalSquare, setOriginalSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameBoard, setGameBoard] = useState(gameModel.currentBoardStatus);
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    setGameBoard(gameModel.currentBoardStatus);
  }, [gameModel.currentBoardStatus]);

  
  const handlePieceClick = (piece) => {
    // Block action if not the player's turn or if the piece has the ball
    if (gameModel.turnPlayer !== piece.color || piece.hasBall) {
      console.log("Either it's not your turn or the piece cannot be moved.");
      return;
    }
  
    const { row, col } = getKeyCoordinates(piece.position);
    const moves = getPieceMoves(row, col, gameBoard, hasMoved, originalSquare);
  
    // If clicking the same piece after it has moved, only show the original square as a possible move.
    // Otherwise, calculate and show all possible moves for the piece.
    if (activePiece && activePiece.position === piece.position) {
      if (hasMoved) {
        setPossibleMoves(moves);
      } else {
        setActivePiece(null);
        setPossibleMoves([]);
        setOriginalSquare(null);
      }
    } else if (activePiece && activePiece.position !== piece.position) {
      console.log("Make a move with your active piece first")
    } else if(!activePiece){
      setActivePiece(piece)
      setPossibleMoves(moves)
      setOriginalSquare(piece.position);
    }

  };
  

  const handleCellClick = (cellKey) => {
    const { row, col } = getKeyCoordinates(cellKey);
    const isLegalMove = possibleMoves.some(move => move.row === row && move.col === col);
    if(isLegalMove){
      const newGameBoard = movePiece(activePiece.position, cellKey, gameBoard)
      setGameBoard(newGameBoard)
      //havent Moved
      if(hasMoved === false){
        setHasMoved(true)
        setOriginalSquare(activePiece.position)
        activePiece.position = cellKey;
        setPossibleMoves([originalSquare])
        //has moved
      } else {
        setHasMoved(false)
        setOriginalSquare(null)
        setPossibleMoves([])
        setActivePiece(null)
      }
    } else {
      console.log("Illegal Move")
    }
  };
  

  const handlePassTurn = () => {
    updateGameModel({
      ...gameModel,
      turnPlayer: gameModel.turnPlayer === 'white' ? 'black' : 'white',
    });
    setActivePiece(null);
    setHasMoved(false);
    setPossibleMoves([]);
    setOriginalSquare(null);
  };

  const renderBoard = () => {
    return Object.entries(gameBoard).map(([cellKey, cellData]) => {
      const { row, col } = getKeyCoordinates(cellKey);
      const isPossibleMove = possibleMoves.some(move => cellKey === toCellKey(move.row, move.col));
      return (
        <GridCell
          key={cellKey}
          row={row}
          col={col}
          highlight={isPossibleMove}
          onClick={() => handleCellClick(cellKey)}>
          {cellData && (
          <Piece
            color={cellData.color}
            hasBall={cellData.hasBall}
            position={cellKey} // This is fine as it correctly sets the Piece's props.
            onClick={() => handlePieceClick({ ...cellData, position: cellKey })} // Pass the complete piece data including position
          />
          )}
        </GridCell>
      );
    });
  };

  return (
    <>
      <GridContainer>{renderBoard()}</GridContainer>
      <button onClick={handlePassTurn}>Pass Turn</button>
    </>
  );
};

export default GameBoard;
