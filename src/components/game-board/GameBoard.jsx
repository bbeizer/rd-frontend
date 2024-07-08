import React, { useState, useEffect } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Modal from '../modal/modal'
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import { getGameById, updateGame } from '../../services/gameService';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves } from '../../gameLogic/playerMovesRuleEngine';
import { movePiece } from './helpers';
import { getValidPasses } from './helpers/getValidPasses';
import { didWin } from './helpers/didWin';
import { useParams } from 'react-router-dom';

const GameBoard = ({ gameModel, updateGameModel }) => {
  const { gameId } = useParams();
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [showNotYourTurnModal, setShowNotYourTurnModal] = useState(false);
  const [activePiece, setActivePiece] = useState(null);
  const [originalSquare, setOriginalSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameBoard, setGameBoard] = useState(gameModel.currentBoardStatus);
  const [hasMoved, setHasMoved] = useState(false);
  const [possiblePasses, setPossiblePasses] = useState([]);
  const [intervalId, setIntervalId] = useState(null);
  const playerColor = localStorage.getItem('userColor');

  const fetchGame = async () => {
    try {
        const fetchedGame = await getGameById(gameId);
        setGameBoard(fetchedGame.currentBoardStatus);
        const playerColor = localStorage.getItem('userColor');
        const isTurn = fetchedGame.currentPlayerTurn === playerColor;

        setIsUserTurn(isTurn);
        if (isTurn && intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        } else if (!isTurn && !intervalId) {
            setIntervalId(setInterval(fetchGame, 3000));
        }
    } catch (error) {
        console.error('Error fetching game:', error);
    }
};

  useEffect(() => {
    fetchGame(); // Initial fetch
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
  }, [gameId]);
  
  const handlePieceClick = (piece) => {
    console.log("Piece Handler Hit")
    if (!isUserTurn) {
      console.log("It's not your turn!"); // This can also trigger a modal or a toast message
      return;
    }
    if (piece.color !== playerColor) {
      console.log("You can only move your own pieces!");
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
  

  const handleCellClick = async (cellKey) => {
    console.log("Cell Handler triggered");
    console.log("Active Piece:", activePiece);
    console.log("Possible Passes:", possiblePasses);
    console.log("Possible Moves:", possibleMoves);

    const { row, col } = getKeyCoordinates(cellKey);
    console.log("Clicked Cell Coordinates:", { row, col });

    if (!activePiece) {
      console.log("Select a piece first.");
      return;
    }

    console.log("Active Piece Position:", activePiece.position);
    console.log("Checking action type (Move or Pass)");

    const isPassAction = activePiece.hasBall && possiblePasses.includes(cellKey);
    console.log("Is Pass Action:", isPassAction);

    if (isPassAction) {
      console.log("Executing Pass Action");
      let newGameBoard = { ...gameBoard };
      newGameBoard[activePiece.position].hasBall = false;
      newGameBoard[cellKey].hasBall = true;
      setGameBoard(newGameBoard);
      updateGameModel({ ...gameModel, currentBoardStatus: newGameBoard });
      setActivePiece(null);
      setPossiblePasses([]);

      console.log("New Game Board after pass:", newGameBoard);
    } else {
      const isLegalMove = possibleMoves.some(move => move.row === row && move.col === col);
      console.log("Is Legal Move:", isLegalMove);

      if (!isLegalMove) {
        console.log("Illegal Move Attempted");
        return;
      }

      console.log("Executing Legal Move");
      const newGameBoard = movePiece(activePiece.position, cellKey, gameBoard);
      console.log("New Game Board after move:", newGameBoard);
      setGameBoard(newGameBoard);
      updateGameModel({ ...gameModel, currentBoardStatus: newGameBoard }); // frontend update

      try {
        const updatedGame = await updateGame(gameId, { ...gameModel, currentBoardStatus: newGameBoard }); // backend call
        console.log("Updated Game Data:", updatedGame);
      } catch (error) {
        console.error('Failed to update game:', error);
      }

      if (hasMoved) {
        console.log("Piece has moved, resetting state");
        setActivePiece(null); // Deselect the piece after moving
        setPossibleMoves([]);
        setHasMoved(false); // Reset move state for the next turn
        setOriginalSquare(null); // Clear original square after completing the move
      } else {
        console.log("Piece selected, setting moved state");
        setHasMoved(true);
        activePiece.position = cellKey; // Update the position of the active piece
        setPossibleMoves([originalSquare]); // Allow moving back to the original square only
      }
    }
};

  
const handlePassTurn = async () => {
  const currentPlayerColor = localStorage.getItem('userColor');
  const nextPlayerTurn = currentPlayerColor === 'white' ? 'black' : 'white';

  try {
    const updatedModel = { ...gameModel, currentPlayerTurn: nextPlayerTurn };
    updateGameModel(updatedModel); // Optimistically update UI
    const updatedGame = await updateGame(gameId, { currentPlayerTurn: nextPlayerTurn });

    console.log("Updated game data:", updatedGame);
    setIsUserTurn(updatedGame.currentPlayerTurn === currentPlayerColor);
    setShowNotYourTurnModal(updatedGame.currentPlayerTurn !== currentPlayerColor);

    // Reset game state
    setActivePiece(null);
    setHasMoved(false);
    setPossibleMoves([]);
    setOriginalSquare(null);

    // Manage interval based on turn
    if (updatedGame.currentPlayerTurn === currentPlayerColor && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    } else if (!intervalId) {
      setIntervalId(setInterval(fetchGame, 3000));  // fetchGame needs to be available in this context
    }
  } catch (error) {
    console.error('Failed to update game:', error);
    // Optionally, notify the user about the error
  }
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
          onClick={isUserTurn ? () => handleCellClick(cellKey) : () => {}}>
          {cellData && (
          <Piece
            color={cellData.color}
            hasBall={cellData.hasBall}
            position={cellKey} // This is fine as it correctly sets the Piece's props.
            onClick={isUserTurn ? () => handlePieceClick({ ...cellData, position: cellKey }) : () => {}}// Pass the complete piece data including position
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
    <button onClick={handlePassTurn} disabled={!isUserTurn}>Pass Turn</button>
    <Modal show={!isUserTurn} onClose={() => {}}>
    <p>It's not your turn. Please wait for the other player.</p>
    </Modal>
      
    </>
  );
};

export default GameBoard;
