import React, { useState, useEffect } from 'react';
import './GameBoard.css';
import Confetti from 'react-confetti';
import GridCell from '../grid/grid-cell/GridCell';
import Modal from '../modal/modal';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import { didWin } from './helpers/didWin';
import { getGameById, updateGame } from '../../services/gameService';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves } from '../../gameLogic/playerMovesRuleEngine';
import { movePiece } from './helpers';
import { getValidPasses } from './helpers/getValidPasses';
import { passBall } from './helpers/passBall';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import isEqual from 'lodash/isEqual';
import { canMovePiece } from './helpers';
import { canTogglePiece } from './helpers/canTogglePiece';
import { validMove } from './helpers/validMove';
import {canReceiveBall} from './helpers/canReceiveBall'

const GameBoard = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [activePiece, setActivePiece] = useState(null);
  const [originalSquare, setOriginalSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameBoard, setGameBoard] = useState(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [possiblePasses, setPossiblePasses] = useState([]);
  const [intervalId, setIntervalId] = useState(null);
  const playerColor = localStorage.getItem('userColor');
  const [playerDetails, setPlayerDetails] = useState({ white: {}, black: {} });
  const [winner, setWinner] = useState()
  const navigate = useNavigate();

  // Fetch game data initially and start/stop polling based on game state
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const fetchedGame = await getGameById(gameId);
        setGameData(fetchedGame);
        setGameBoard(fetchedGame.currentBoardStatus);
        setIsUserTurn(fetchedGame.currentPlayerTurn === playerColor);
        setHasMoved(fetchedGame.hasMoved);
        setOriginalSquare(fetchedGame.originalSquare);
        console.log("Original Square Set To:", fetchedGame.originalSquare
        );
        setActivePiece(fetchedGame.activePiece)
        setPlayerDetails({
          white: { name: fetchedGame.whitePlayerName, isUserTurn: fetchedGame.currentPlayerTurn === 'white' },
          black: { name: fetchedGame.blackPlayerName, isUserTurn: fetchedGame.currentPlayerTurn === 'black' }
        });
      } catch (error) {
        console.error('Error fetching game data:', error);
      }
    };
  
    fetchGame();
    let interval;
  
    if (!isUserTurn) {
      interval = setInterval(fetchGame, 3000); // Start polling if it's not the user's turn
    }
  
    return () => clearInterval(interval); // Cleanup on unmount or dependency change
  }, [gameId, playerColor, isUserTurn, originalSquare, hasMoved, winner]); // Ensure effect runs when it's the user's turn or the game ID/player changes  
  
  const handlePieceClick = (piece) => {
    debugger
    if (!canMovePiece(isUserTurn, playerColor, piece)) return;
    const { row, col } = getKeyCoordinates(piece.position);
    if (canTogglePiece(piece, hasMoved, activePiece)) {
      togglePieceSelection(piece, hasMoved, row, col);
      return;
  }

  if (canReceiveBall(piece, activePiece, gameData.currentBoardStatus)) {
      attemptPass(piece);
  } else {
      console.log("Illegal pass or move.");
  }
}

const togglePieceSelection = (piece, hasMoved, row, col) => {
  let newActivePiece
  // If a move has been made, do not allow toggling to a different piece or deselecting
  if(piece.hasBall){
    newActivePiece = piece
  } else {
  if (hasMoved) {
      // If the same piece is clicked again, it may toggle off, otherwise do nothing
      if (isEqual(activePiece, piece)) {
        newActivePiece = activePiece
      } else {
        console.log("you selected a piece that hasnt moved when you moved a piece")
        return;
      }
  } else {
    newActivePiece = piece;
  }
}
  setActivePiece(newActivePiece);

  // Prepare updates for state synchronization
  const updates = {
      activePiece: newActivePiece,
  };

  updatePossibleMovesOrPasses(newActivePiece, row, col);
  updateLocalAndRemoteGameState(updates);
};


const updatePossibleMovesOrPasses = (piece, row, col) => {
  if (!piece) {
      // Clear moves and passes if no piece is active
      setPossiblePasses([]);
      setPossibleMoves([]);
  } else {
      // Calculate moves or passes based on the current state of the piece
      const movesOrPasses = piece.hasBall ? 
          getValidPasses(row, col, gameData.currentPlayerTurn, gameBoard) : 
          getPieceMoves(row, col, gameBoard, hasMoved, gameData.originalSquare);
      piece.hasBall ? setPossiblePasses(movesOrPasses) : setPossibleMoves(movesOrPasses);
  }
};

const clearMovesAndPasses = () => {
  setPossiblePasses([]);
  setPossibleMoves([]);
};

const attemptPass = async (piece) => {
  const updatedBoard = passBall(activePiece.position, piece.position, gameBoard);
  setGameBoard(updatedBoard);
  setActivePiece(null); // Reset active piece after pass
  clearMovesAndPasses();
  try {
      const updatedGame = await updateGame(gameId, { currentBoardStatus: updatedBoard });
      console.log("Updated Game Data:", updatedGame);
      setGameData(updatedGame);
      if (didWin(updatedBoard)) {
          handleGameEnd(playerColor); // Handle game end if the player won
      }
  } catch (error) {
      console.error('Failed to update game:', error);
  }
};
  
  const handleCellClick = async (cellKey) => {
    if (!validMove(cellKey, possibleMoves, activePiece)) return;
    const newGameBoard = executeMove(cellKey);
    updateLocalAndRemoteGameState(newGameBoard);
  };

  const executeMove = (cellKey) => {
    const newGameBoard = movePiece(activePiece.position, cellKey, gameBoard);
    // Determine if this move is a new move or a return to the original position
    const isReturningToOriginal = cellKey === originalSquare;
    const newActivePiece = {...activePiece, position: cellKey}
    const updates = {
        currentBoardStatus: newGameBoard,
        hasMoved: !isReturningToOriginal,
        originalSquare: isReturningToOriginal ? null : activePiece.position,
        // Maintain or clear the active piece based on the move type
        activePiece: isReturningToOriginal ? null : newActivePiece
    };

    // Apply local state updates
    setHasMoved(updates.hasMoved);
    setOriginalSquare(updates.originalSquare);
    setActivePiece(updates.activePiece);
    setPossibleMoves([]);
    updateLocalAndRemoteGameState(updates);
    return newGameBoard;
};

const updateLocalAndRemoteGameState = async (updates) => {
  // Optimistically update local state with new game details
  setGameData(prevGameData => ({ ...prevGameData, ...updates }));

  try {
    // Perform the remote update and sync local state with the response
    const updatedGame = await updateGameModel(updates);
    setGameData(updatedGame);
  } catch (error) {
    console.error('Failed to update game:', error);
    // Handle rollback or retry logic as needed
  }
};

  const handleGameEnd = async (winnerColor) => {
    clearInterval(intervalId);  // Stop any active intervals
    setWinner(true);
    const updatedGame = await updateGame(gameId, { status: 'completed', winner: winnerColor});
};

const handlePassTurn = async () => {
  const currentPlayerColor = localStorage.getItem('userColor');
  const nextPlayerTurn = currentPlayerColor === 'white' ? 'black' : 'white';

  const updates = {
    currentPlayerTurn: nextPlayerTurn,
    activePiece: null,  // Ensure the active piece is reset on the backend as well
    hasMoved: false,    // Reset movement status
    originalSquare: null // Clear the original square
  };

  try {
    const updatedGame = await updateGame(gameId, updates);
    setGameData(updatedGame);
    setIsUserTurn(updatedGame.currentPlayerTurn === currentPlayerColor);
    setActivePiece(null);
    setHasMoved(false);
    setPossibleMoves([]);
    setOriginalSquare(null);

    // Manage polling based on turn
    if (updatedGame.currentPlayerTurn === currentPlayerColor && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    } else if (!intervalId) {
      setIntervalId(setInterval(fetchGame, 3000));
    }
  } catch (error) {
    console.error('Failed to update game:', error);
  }
};

const updateGameModel = async (updates) => {
  try {
    const updatedGame = await updateGame(gameId, updates);
    setGameData(updatedGame);  // Update the entire game data
    setGameBoard(updatedGame.currentBoardStatus);  // Specifically update the board if present
    setIsUserTurn(updatedGame.currentPlayerTurn === playerColor);  // Update turn information
    setHasMoved(updatedGame.hasMoved);
    setOriginalSquare(updatedGame.originalPosition);
    setActivePiece(updatedGame.activePiece)
  } catch (error) {
    console.error('Failed to update game:', error);
  }
};

  //still need to make
  const handleRematch = async () => {
    // Define the initial state for a new game, keeping the same players.
    const initialGameData = {
      ...gameData, // Use existing game data to preserve player names, colors, etc.
      currentBoardStatus: getInitialBoardStatus(), // Reset the board state
      currentPlayerTurn: gameData.currentPlayerTurn === 'white' ? 'black' : 'white', // Alternate starting player
      status: 'playing', // Ensure game status is reset to active
    };
  
    try {
      const updatedGame = await updateGame(gameId, initialGameData);
      setGameData(updatedGame);
      setGameBoard(updatedGame.currentBoardStatus);
      setIsUserTurn(updatedGame.currentPlayerTurn === playerColor);
      setActivePiece(null);
      setPossibleMoves([]);
      setPossiblePasses([]);
      setHasMoved(false);
      setOriginalSquare(null);
    } catch (error) {
      console.error('Failed to start a new game:', error);
    }
  };
  

  const renderBoard = () => {
    if (!gameBoard) {
      return <p>Loading game board...</p>;
    }
    return (
      <>
        {Object.entries(gameBoard).map(([cellKey, cellData]) => {
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
              onClick={isUserTurn ? () => handleCellClick(cellKey) : () => {}}
            >
              {cellData && (
                <Piece
                  color={cellData.color}
                  hasBall={cellData.hasBall}
                  position={cellKey}
                  onClick={isUserTurn ? () => handlePieceClick({ ...cellData, position: cellKey }) : () => {}}
                />
              )}
            </GridCell>
          );
        })}
      </>
    );
  };

  const rotationStyle = playerColor === 'black' ? '180deg' : '0deg';
  const isWhite = playerColor === 'white';

  return (
    <div className="game-container">
      {console.log(gameData)}
      {gameData && gameData.status === 'completed' && <Confetti />}
      <PlayerInfoBar
        playerName={isWhite ? playerDetails.black.name : playerDetails.white.name}
      />
      <div className="board-and-info">
        <div className="board-container" style={{ '--rotation': rotationStyle }}>
          <GridContainer>{renderBoard()}</GridContainer>
        </div>
        {console.log(gameData && gameData.hasMoved)}
        {gameData && gameData.status === 'playing' && !isUserTurn && (
        <div className="modal-side">
          <Modal>
            <p>It's not your turn. Please wait for the other player.</p>
          </Modal>
        </div>
      )}
        {gameData && gameData.status === 'completed' && (
          <div className="game-over-controls">
            <h2>{gameData.winner} wins!</h2>
            <button onClick={handleRematch}>Rematch</button>
            <button onClick={() => navigate('/')}>Return to Lobby</button>
          </div>
        )}
      </div>
      <PlayerInfoBar
        playerName={isWhite ? playerDetails.white.name : playerDetails.black.name}
      />
      <button 
        onClick={handlePassTurn} 
        disabled={!isUserTurn} 
        style={{ alignSelf: 'flex-start', margin: '10px' }}
      >
        Pass Turn
      </button>
    </div>
  );
  
};

export default GameBoard;
