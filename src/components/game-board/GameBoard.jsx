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
import { isCurrentUsersTurn } from './helpers/isCurrentUsersTurn';
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

  useEffect(() => {
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

    fetchGame(); // Initial fetch

    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
  }, [gameId, isUserTurn]);
  
  const handlePieceClick = (piece) => {
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
      updateGameModel({ ...gameModel, currentBoardStatus: newGameBoard }); //frontend

      try {
        const updatedGame = await updateGame(gameId, { ...gameModel, currentBoardStatus: newGameBoard }); //backend call
      } catch (error) {
        console.error('Failed to update game:', error);
      }
  
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
  
  const handlePassTurn = async () => {
    try {
      const currentPlayerColor = localStorage.getItem('userColor'); // Assuming color is stored
      console.log("current player color " + currentPlayerColor );
      const nextPlayerTurn = currentPlayerColor === 'white' ? 'black' : 'white';
      // will delete later temporary for UI purposes
      const updatedModel = {
        ...gameModel,
        currentPlayerTurn: nextPlayerTurn,
      };
      updateGameModel(updatedModel); // Optimistically update UI
      // will delete later temporary for UI purposes
      const updatedGame = await updateGame(gameId, { currentPlayerTurn: nextPlayerTurn });
      console.log("Updated game data:", updatedGame);
      
      // Check if the next turn is for this user
      setIsUserTurn(updatedGame.currentPlayerTurn === currentPlayerColor);
      setShowNotYourTurnModal(updatedGame.currentPlayerTurn !== currentPlayerColor);
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  
    // Clear local game state settings
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
