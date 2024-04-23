import React, { useState, useEffect } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import { createGame } from '../../services/gameService';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves } from '../../gameLogic/playerMovesRuleEngine';
import { movePiece } from './helpers';
import { getValidPasses } from './helpers/getValidPasses';
import { didWin } from './helpers/didWin';

const GameBoard = ({ gameModel, updateGameModel }) => {
  const [activePiece, setActivePiece] = useState(null);
  const [originalSquare, setOriginalSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameBoard, setGameBoard] = useState(gameModel.currentBoardStatus);
  const [hasMoved, setHasMoved] = useState(false);
  const [possiblePasses, setPossiblePasses] = useState([]);

  useEffect(() => {
    // This function initializes the game if the currentBoardStatus is empty or not set
    const initializeGame = async () => {
      try {
        const newGame = await createGame();
        updateGameModel(newGame); // This should update your gameModel state with the new game data
      } catch (error) {
        console.error('Failed to initialize new game:', error);
      }
    };
      debugger
      initializeGame();
      setGameBoard(gameModel.currentBoardStatus);
    
  }, []); // The effect runs when currentBoardStatus changes
  
  
  const handlePieceClick = (piece) => {
    // Block action if not the player's turn or if the piece has the ball
    if (gameModel.turnPlayer !== piece.color) {
      console.log("Not you're turn!");
      return;
    }
    const { row, col } = getKeyCoordinates(piece.position);
    if(piece.hasBall === false) {
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
  } else {
    if (activePiece && activePiece.position === piece.position) {
      setPossiblePasses([]);
      setActivePiece(null);
    } else {
      const passes = getValidPasses(row, col, gameModel.turnPlayer, gameBoard);
      console.log(passes);
      setPossiblePasses(passes);
      setActivePiece(piece);
    }
  }

  };
  

  const handleCellClick = (cellKey) => {
    const { row, col } = getKeyCoordinates(cellKey);
  
    if (!activePiece) {
      console.log("Select a piece first.");
      return;
    }
  
    const isPassAction = activePiece.hasBall && possiblePasses.includes(cellKey);
  
    if (isPassAction) {
      // Pass the ball logic
      let newGameBoard = { ...gameBoard };
      newGameBoard[activePiece.position].hasBall = false;
      newGameBoard[cellKey].hasBall = true;
      setGameBoard(newGameBoard);
      updateGameModel({ ...gameModel, currentBoardStatus: newGameBoard });
      setActivePiece(null);
      setPossiblePasses([]);
    } else {
      const isLegalMove = possibleMoves.some(move => move.row === row && move.col === col);
      if (!isLegalMove) {
        console.log("Illegal Move");
        return;
      }
  
      // Move the piece if it's a legal move
      const newGameBoard = movePiece(activePiece.position, cellKey, gameBoard);
      setGameBoard(newGameBoard);
      updateGameModel({ ...gameModel, currentBoardStatus: newGameBoard });
  
      if (hasMoved) {
        setActivePiece(null); // Deselect the piece after moving
        setPossibleMoves([]);
        setHasMoved(false); // Reset move state for the next turn
        setOriginalSquare(null); // Clear original square after completing the move
      } else {
        setHasMoved(true);
        activePiece.position = cellKey; // Update the position of the active piece
        setPossibleMoves([originalSquare]); // Allow moving back to the original square only
      }
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
      const isPossiblePass = possiblePasses.some(pass => cellKey === pass);
      return (
        <GridCell
          key={cellKey}
          row={row}
          col={col}
          redHighlight={isPossibleMove}
          yellowHighlight={isPossiblePass}
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
      {didWin(gameBoard) && console.log("winner")} 
      <GridContainer>{renderBoard()}</GridContainer>
      <button onClick={handlePassTurn}>Pass Turn</button>
    </>
  );
};

export default GameBoard;
