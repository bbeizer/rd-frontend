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
  const navigate = useNavigate();
  const [gameState, setGameState] = useState({
    gameId: gameId,
    gameData: null,
    isUserTurn: true,
    activePiece: null,
    possibleMoves: [],
    gameBoard: null,
    movedPiece: null,
    movedPieceOriginalPosition: null,
    possiblePasses: [],
    winner: null
  });
  const playerColor = localStorage.getItem('userColor');


  useEffect(() => {
    const fetchGame = async () => {
      try {
        const fetchedGame = await getGameById(gameId);
        if (fetchedGame) {
          setGameState(prevState => ({
            ...prevState,
            gameData: fetchedGame,
            isUserTurn: fetchedGame.currentPlayerTurn === localStorage.getItem('userColor'),
            gameBoard: fetchedGame.currentBoardStatus
          }));
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
      }
    };

    const interval = setInterval(fetchGame, 3000);
    fetchGame(); // Initial fetch

    return () => clearInterval(interval);
  }, [gameId]);
  
  function handleClick(event) {
    const clickedElement = event.target;
    const isPiece = clickedElement.dataset.isPiece === "true";  // Correct data attribute retrieval
    const isCell = clickedElement.dataset.isCell === "true";
    const hasBall = clickedElement.dataset.hasBall === "true";
    setGameState(prevState => {
      let newState = { ...prevState };
      if (isPiece) {
        const cellKey = clickedElement.position
        const {row, col} = getKeyCoordinates(cellKey)
        const pieceColor = clickedElement.color
        if (hasBall) {
          newState.activePiece = clickedElement;
          newState.possiblePasses = getValidPasses(row,col,pieceColor, gameState.gameBoard);  // Assuming you have a function for this
        //no moved piece and no active pieces
        } else if (!prevState.movedPiece && !prevState.activePiece) {
          newState.activePiece = clickedElement;
          newState.possibleMoves = getPieceMoves(row, col, gameState.gameBoard, gameState.movePiece, gameState.movedPieceOriginalPosition);  // Assuming a function for this
        //unselecting a piece thats been clicked
        } else if (prevState.activePiece && clickedElement === prevState.activePiece) {
          newState.activePiece = null;
          newState.possibleMoves = [];
        //if theres an active piece and the piece youve clicked isnt the active piece
        } else if (prevState.activePiece && clickedElement !== prevState.activePiece) {
          //if the active piece has the ball try to pass
          if (prevState.activePiece.hasBall) {
            newState.gameBoard = passBall()
            didWin(gameState.gameBoard)
            getValidPasses(row,col,pieceColor, gameState.gameBoard);
            newState.activePiece = clickedElement;
          } else {
            newState.activePiece = clickedElement;
            newState.possibleMoves = getPieceMoves(row, col, gameState.gameBoard, gameState.movePiece, gameState.movedPieceOriginalPosition);
          }
        }
      } else if (isCell) {
        if (prevState.activePiece) {
          if (!prevState.activePiece.hasBall && prevState.possibleMoves.includes(clickedElement)) {
            newState.gameBoard = movePiece();
            newState.movedPiece = prevState.activePiece;  // Track the moved piece
            newState.originalSquare = getOriginalSquare(prevState.activePiece);
            newState.possibleMoves = calculatePossibleMoves(newState.originalSquare);  // Update moves
          }
        } else {
          newState.activePiece = null;
          newState.possibleMoves = [];
          newState.possiblePasses = [];
        }
      } else {
        // Display warning if neither piece nor square
        newState = displayWarning(newState, "Invalid operation.");
      }
  
      return newState;
    });
  }

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
  
  // Helper functions need to be defined to handle the logic for moves, passes, etc.
  
  
  const renderBoard = () => {
    if (!gameState.gameData) {
      return <p>Loading game board...</p>;
    }
    return (
      <>
        {Object.entries(gameState.gameData.currentBoardStatus).map(([cellKey, cellData]) => {
          const { row, col } = getKeyCoordinates(cellKey);
          const isPossibleMove = gameState.possibleMoves.some(move => cellKey === toCellKey(move.row, move.col));
          const isPossiblePass = gameState.possiblePasses.some(pass => cellKey === pass);
          const isActivePiece = gameState.activePiece && gameState.activePiece.position === cellKey;
          return (
            <GridCell
            key={cellKey}
            row={row}
            col={col}
            redHighlight={isPossibleMove}
            yellowHighlight={isPossiblePass}
            blueHighlight={isActivePiece}
            data-type="cell"
            data-id={cellKey}
            onClick={handleClick}
        >
          {cellData && (
            <Piece
             color={cellData.color}
              hasBall={cellData.hasBall}
              position={cellKey}
              data-type="piece"
              data-id={cellData.id}
              onClick={(e) => { e.stopPropagation(); handleClick(e); }}
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

  if (!gameState.gameData) {
    return <div>Loading game data...</div>;
  }
  return (
    <div className="game-container">
      {console.log(gameState)}
      {gameState.gameData.status === 'completed' && <Confetti />}
      <PlayerInfoBar
        playerName={gameState.isUserTurn ? gameState.gameData.blackPlayerName : gameState.gameData.whitePlayerName}
      />
      <div className="board-and-info">
      <div className="board-container" style={{ '--rotation': rotationStyle }}>
        <div className="board-container">
          <GridContainer>{renderBoard()}</GridContainer>
        </div>
        </div>
      
        {gameState.gameData.status === 'playing' && !gameState.isUserTurn && (
          <Modal>
            <p>It's not your turn. Please wait for the other player.</p>
          </Modal>
        )}
        {gameState.gameData.status === 'completed' && (
          <div className="game-over-controls">
            <h2>{gameData.winner} wins!</h2>
            <button onClick={() => navigate('/')}>Return to Lobby</button>
          </div>
        )}
      </div>
      <PlayerInfoBar
        playerName={isWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName}
      />
    </div>
  );
};

export default GameBoard;
