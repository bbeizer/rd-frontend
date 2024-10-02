import { useState, useEffect } from 'react';
import './GameBoard.css';
import Confetti from 'react-confetti';
import GridCell from '../grid/grid-cell/GridCell';
import Modal from '../modal/modal';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import { updateGame } from '../../services/gameService';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { fetchGame } from './helpers/fetchGame';
import { updateGameState } from './helpers/updateGameState';

const GameBoard = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState({
    gameId: gameId,
    gameData: null,
    isUserTurn: true,
    activePiece: null,
    possibleMoves: [],
    movedPiece: null,
    movedPieceOriginalPosition: null,
    possiblePasses: [],
    playerColor: localStorage.getItem('userColor'),
    winner: null
  });
  const [intervalId, setIntervalId] = useState(null);
  const isUserWhite = gameState.playerColor === 'white';
  const currentPlayerName = gameState.gameData ? (isUserWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName) : 'Loading...';
  const opponentPlayerName = gameState.gameData ? (!isUserWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName) : 'Loading...';

  useEffect(() => {
    if (!gameId) return; // Exit if gameId is not defined
    
    const pollGameData = async () => {
      await fetchGame(gameId, setGameState, localStorage.getItem('userColor'));
    };
    
    // Poll the game data once immediately
    pollGameData();
    
    // Set up interval polling if it's not the user's turn
    if (!gameState.isUserTurn && !intervalId) {
      const newIntervalId = setInterval(pollGameData, 3000);
      setIntervalId(newIntervalId);
    }
    
    // Clear the interval when it becomes the user's turn
    if (gameState.isUserTurn && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    // Cleanup on component unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    };
  }, [gameState.isUserTurn, gameId, intervalId]);
  
  
  const handleClick = async (event) => {
    event.stopPropagation();
    const cellKey = event.currentTarget.id;
    const newState = updateGameState(cellKey, gameState);
    setGameState(newState);

    if (newState.winner) {
      handleGameEnd(newState.winner);
    }

    try {
      await updateGame(gameId, newState);
    } catch (error) {
      console.error('Failed to update game on server:', error);
    }
  };

  const handlePassTurn = async () => {
    const currentPlayerColor = localStorage.getItem('userColor');
    const nextPlayerTurn = currentPlayerColor === 'white' ? 'black' : 'white';
    
    try {
      const updates = {
        currentBoardStatus: gameState.gameData.currentBoardStatus,
        currentPlayerTurn: nextPlayerTurn,
        activePiece: null,
        movedPiece: null,
        originalSquare: null,
        possibleMoves: [],
        possiblePasses: []
      };
      
      const updatedGame = await updateGame(gameId, updates);
      
      setGameState(prevState => ({
        ...prevState,
        gameData: updatedGame,
        movedPiece: null,
        isUserTurn: updatedGame.currentPlayerTurn === currentPlayerColor,
        activePiece: null,
        originalSquare: null,
        possibleMoves: [],
        possiblePasses: []
      }));
      
      // Manage polling interval
      if (updatedGame.currentPlayerTurn === currentPlayerColor) {
        if (intervalId) {
          clearInterval(intervalId);
          setIntervalId(null);
        }
      } else if (!intervalId) {
        const newIntervalId = setInterval(() => {
          fetchGame(gameId, setGameState, currentPlayerColor);
        }, 3000);
        setIntervalId(newIntervalId);
      }
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  };
  
  const handleGameEnd = async (winnersName) => {
    clearInterval(intervalId); // Stop polling
    setGameState((prevState) => ({
      ...prevState,
      gameData: { 
        ...prevState.gameData,
        currentBoardStatus: gameState.gameData.currentBoardStatus,
        status: 'completed', 
        winner: winnersName 
      },
      winner: winnersName, // Set the winner in the local state
    }));
  
    try {
        const updates = {
          currentBoardStatus: gameState.gameData.currentBoardStatus,
          gameData: gameState.gameData,
          activePiece: null,
          movedPiece: null,
          originalSquare: null,
          possibleMoves: [],
          possiblePasses: [],
          winner: winnersName,
          status: 'completed' 
        }
      await updateGame(gameId, updates);
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  };
  

  const renderBoard = () => {
    if (!gameState.gameData.currentBoardStatus) {
      return <p>Loading game board...</p>;
    }
    return (
      <>
        {Object.entries(gameState.gameData.currentBoardStatus).map(([cellKey, cellData]) => {
          const isPossibleMove = gameState.possibleMoves.includes(cellKey);
          const isPossiblePass = gameState.possiblePasses.includes(cellKey);
          let isActivePiece = null;
          if(gameState.activePiece){
            isActivePiece = gameState.activePiece.position === cellKey;
          }
          return (
            <GridCell
            key={cellKey}
            row={parseInt(cellKey[1], 10) - 1}
            col={cellKey.charCodeAt(0) - 'a'.charCodeAt(0)}
            redHighlight={isPossibleMove}
            yellowHighlight={isPossiblePass}
            blueHighlight={isActivePiece}
            data-type="cell"
            id={cellKey}
            onClick={handleClick}
        >
          {cellData && (
            <Piece
              color={cellData.color}
              hasBall={cellData.hasBall}
              position={cellKey}
              isPiece="true"
              onClick={(e) => { e.stopPropagation(); handleClick(e); }}
              />
            )}
            </GridCell>
          );
        })}
        {console.log(gameState)}
      </>
    );
  };

  if (!gameState.gameData) {
    return <div>Loading game data...</div>;
  }
  const rotationStyle = gameState.playerColor === 'black' ? '180deg' : '0deg';
  return (
    <div className="game-container">
      {gameState.gameData.status === 'completed' && <Confetti />}
      <PlayerInfoBar
        playerName={opponentPlayerName}
      />
      <div className="board-and-info">
        <div className="board-container" style={{ transform: `rotate(${rotationStyle})` }}>
        <div className="board-container">
          <GridContainer>{renderBoard()}</GridContainer>
        </div>
        </div>
      
        {gameState.gameData.status === 'playing' && !gameState.isUserTurn && (
          <Modal>
            <p>It&apos;s not your turn. Please wait for the other player.</p>
          </Modal>
        )}
        {gameState.gameData.status === 'completed' && (
          <div className="game-over-controls">
            <h2>{gameState.winner} wins!</h2>
            <button onClick={() => navigate('/')}>Return to Lobby</button>
          </div>
        )}
      </div>
      <PlayerInfoBar
        playerName={currentPlayerName}
      />
      <button 
        onClick={handlePassTurn} 
        disabled={!gameState.isUserTurn} 
        style={{ alignSelf: 'flex-start', margin: '10px' }}
      >
        Pass Turn
      </button>
    </div>
    
  );
};

export default GameBoard;
