import React, { useState, useEffect } from 'react';
import './GameBoard.css'
import GridCell from '../grid/grid-cell/GridCell';
import Modal from '../modal/modal'
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import { getGameById, updateGame } from '../../services/gameService';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves } from '../../gameLogic/playerMovesRuleEngine';
import { movePiece } from './helpers';
import { getValidPasses } from './helpers/getValidPasses';
import { passBall } from './helpers/passBall'
import { useParams } from 'react-router-dom';

const GameBoard = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null)
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

  const fetchGame = async () => {
    try {
      const fetchedGame = await getGameById(gameId);
      setGameData(fetchedGame);
      setGameBoard(fetchedGame.currentBoardStatus);
      setIsUserTurn(fetchedGame.currentPlayerTurn === playerColor);
      setPlayerDetails({
        white: { name: fetchedGame.whitePlayerName, isUserTurn: fetchedGame.currentPlayerTurn === 'white' },
        black: { name: fetchedGame.blackPlayerName, isUserTurn: fetchedGame.currentPlayerTurn === 'black' }
      });
      if (fetchedGame.currentPlayerTurn !== playerColor && !intervalId) {
        setIntervalId(setInterval(fetchGame, 3000)); // Adjust the polling interval as needed
      } else if (fetchedGame.currentPlayerTurn === playerColor && intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    } catch (error) {
      console.error('Error fetching turn:', error);
    }
  };
  
  useEffect(() => {
    fetchGame();
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [gameId, playerColor, intervalId]);
  
  const handlePieceClick = (piece) => {
    console.log("Piece Handler Hit");

    // Check if it's the player's turn and if the player is moving their own piece
    if (!isUserTurn) {
        console.log("It's not your turn!");
        return;
    }
    if (piece.color !== playerColor) {
        console.log("You can only move your own pieces!");
        return;
    }

    const { row, col } = getKeyCoordinates(piece.position);

    // Handling when there is no active piece selected
    if (!activePiece) {
        setActivePiece(piece);
        const movesOrPasses = piece.hasBall ? getValidPasses(row, col, gameData.currentPlayerTurn, gameBoard)
                                            : getPieceMoves(row, col, gameBoard, hasMoved, originalSquare);
        piece.hasBall ? setPossiblePasses(movesOrPasses) : setPossibleMoves(movesOrPasses);
        return;
    }

    // Handling when there is an active piece already selected
    if (activePiece === piece) {
        // Clicking the same piece again should deselect it
        setActivePiece(null);
        setPossiblePasses([]);
        setPossibleMoves([]);
        return;
    }

    // Attempting to pass the ball from the active piece to another piece
    if (activePiece.hasBall && !piece.hasBall) {
        if (possiblePasses.includes(piece.position)) {
            const updatedBoard = passBall(activePiece.position, piece.position, gameBoard);
            
            updateGameModel(updatedBoard);
            setActivePiece(null);
            setPossiblePasses([]);
        } else {
            console.log("Illegal pass");
        }
    } else {
        // Setting new active piece and calculating moves or passes if not passing
        setActivePiece(piece);
        const movesOrPasses = piece.hasBall ? getValidPasses(row, col, gameData.currentPlayerTurn, gameBoard)
                                            : getPieceMoves(row, col, gameBoard, hasMoved, originalSquare);
        piece.hasBall ? setPossiblePasses(movesOrPasses) : setPossibleMoves(movesOrPasses);
    }
};


const handleCellClick = async (cellKey) => {
  console.log("Cell Handler triggered");

  if (!activePiece) {
      console.log("Select a piece first.");
      return;
  }

  const { row, col } = getKeyCoordinates(cellKey);
  console.log("Clicked Cell Coordinates:", { row, col });
  console.log("Active Piece Position:", activePiece.position);

  // Check if it's a legal move
  const isLegalMove = possibleMoves.some(move => move.row === row && move.col === col);
  console.log("Is Legal Move:", isLegalMove);

  if (!isLegalMove) {
      console.log("Illegal Move Attempted");
      return;
  }

  // Execute the move
  console.log("Executing Legal Move");
  if(!originalSquare){
    setOriginalSquare(activePiece.position);
    setHasMoved(true)
  } else {
    setOriginalSquare(null);
    setHasMoved(false)
  }
  const newGameBoard = movePiece(activePiece.position, cellKey, gameBoard);
  console.log("New Game Board after move:", newGameBoard);
  setGameBoard(newGameBoard); // Optimistically update the game board
  setActivePiece(null); // Deselect the piece after moving
  setPossibleMoves([]); // Clear possible moves after action

  try {
      const updatedGame = await updateGame(gameId, { currentBoardStatus: newGameBoard });
      console.log("Updated Game Data:", updatedGame);
      setGameData(updatedGame); // Update the full game data if necessary
  } catch (error) {
      console.error('Failed to update game:', error);
      // Optionally, rollback to previous state if backend update fails
  }
};



  
const handlePassTurn = async () => {
  const currentPlayerColor = localStorage.getItem('userColor');
  const nextPlayerTurn = currentPlayerColor === 'white' ? 'black' : 'white';

  try {
    const updatedModel = { ...gameData, currentPlayerTurn: nextPlayerTurn };
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

/* may not need this... but its for the frontend */
const updateGameModel = async (updatedData) => {
  try {
    const updatedGame = await updateGame(gameId, { currentBoardStatus: updatedData });
    setGameData(updatedGame)
    setGameBoard(updatedGame.currentBoardStatus);
    setIsUserTurn(updatedGame.currentPlayerTurn === playerColor);
  } catch (error) {
    console.error('Failed to update game:', error);
  }
};

const renderBoard = () => {
  if (!gameBoard) {
    // Optionally, display a loading indicator or a message
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
            onClick={isUserTurn ? () => handleCellClick(cellKey) : () => {}}>
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
      {/* Opponent's PlayerInfoBar at the top */}
      <PlayerInfoBar
        playerName={isWhite ? playerDetails.black.name : playerDetails.white.name}
      />
      <div className="board-and-info">
        <div className="board-container" style={{ '--rotation': rotationStyle }}>
          <GridContainer>{renderBoard()}</GridContainer>
        </div>
        <div className="modal-side">
          <Modal show={!isUserTurn} onClose={() => {}}>
            <p>It's not your turn. Please wait for the other player.</p>
          </Modal>
        </div>
      </div>
      {/* Current player's PlayerInfoBar at the bottom */}
      <PlayerInfoBar
        playerName={isWhite ? playerDetails.white.name : playerDetails.black.name}
      />
      {/* Pass Turn Button - Adjust alignment to the left */}
      <button 
        onClick={handlePassTurn} 
        disabled={!isUserTurn} 
        style={{ alignSelf: 'flex-start', margin: '10px' }}
      >
        Pass Turn
      </button>
    </div>
);
        }

export default GameBoard;
