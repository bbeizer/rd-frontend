import { useState, useEffect, useCallback} from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Confetti from 'react-confetti';

import GridCell from '../grid/grid-cell/GridCell';
import GridContainer from '../grid/grid-container/GridContainer';
import Piece from '../piece/Piece';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import Modal from '../modal/modal';

import { updateGame } from '../../services/gameService';
import { getAIMove } from '../../services/aiService';

import { getKeyCoordinates } from '../../utils/gameUtilities';
import { fetchGame, updateGameState} from './helpers';


import './GameBoard.css';

const GameBoard = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState({
    gameId: gameId,
    gameType: null,
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
  const isUserWhite = localStorage.getItem('userColor') === 'white';
  const currentPlayerName = gameState.gameData ? (isUserWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName) : 'Loading...';
  const opponentPlayerName = gameState.gameData ? (!isUserWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName) : 'Loading...';
  
  //updates
  const pollGame = useCallback(async () => {
    if (!gameId) return;

    try {
      await fetchGame(gameId, setGameState, localStorage.getItem("userColor"));
    } catch (error) {
      console.error("Error fetching game data:", error);
    }
  }, [gameId, setGameState]);

  //For polling game for initial Render
  useEffect(() => {
    pollGame();
  }, [pollGame]);
  
  //useEffect for polling in multiplayer games
  useEffect(() => {
    if (!gameState || gameState.gameType !== "multiplayer") return;

    let newIntervalId;
    if (!gameState.isUserTurn) {
      newIntervalId = setInterval(pollGame, 3000);
      setIntervalId(newIntervalId);
    }

    return () => {
      if (newIntervalId) {
        clearInterval(newIntervalId);
        setIntervalId(null);
      }
    };
  }, [gameState, gameState?.isUserTurn, gameState?.gameType, gameId, pollGame]);

  useEffect(() => {
    if (!gameState || gameState.gameType !== "singleplayer") return;

    // ✅ AI is White & User is Black → AI should move first
    if (gameState.currentPlayerTurn === "white" && gameState.playerColor === "black") {
      console.log("AI (White) is making the first move...");
      getAIMove(gameId).then((updatedGame) => {
        setGameState(updatedGame);
      });
    }
  }, [gameState, gameState?.currentPlayerTurn, gameState?.gameType, gameId]);
  
  const handleClick = async (event) => {
    event.stopPropagation();
    const cellKey = event.currentTarget.id;
    const newState = updateGameState(cellKey, gameState);
    setGameState(newState);

    if (newState.winner) {
      handleGameEnd(newState);
    }

    try {
      await updateGame(gameId, newState);
    } catch (error) {
      console.error('Failed to update game on server:', error);
    }
  };

  const handlePassTurn = async () => {
    const currentPlayerColor = localStorage.getItem("userColor");
    const nextPlayerTurn = currentPlayerColor === "white" ? "black" : "white";
  
    try {
      let updates;
      if (gameState.gameType === "multiplayer") {
        updates = {
          ...gameState.gameData,
          currentPlayerTurn: nextPlayerTurn,
          activePiece: null,
          movedPiece: null,
          possibleMoves: [],
          possiblePasses: []
        };
      } else {
        const aiMove = await getAIMove(gameId);
        updates = {
          ...aiMove,
          currentPlayerTurn: currentPlayerColor, 
        };
      }
  
      const updatedGame = await updateGame(gameId, updates);
      setGameState(updatedGame);
  
      // Start polling if it's multiplayer and not the user's turn
      if (gameState.gameType === "multiplayer" && updatedGame.currentPlayerTurn !== currentPlayerColor) {
        if (!intervalId) {
          const newIntervalId = setInterval(pollGame, 3000);
          setIntervalId(newIntervalId);
        }
      } else if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    } catch (error) {
      console.error("Failed to update game:", error);
    }
  };
  
  
  const handleGameEnd = async (newState) => {
    clearInterval(intervalId); // Stop polling

    // Update local game state
    setGameState((prevState) => ({
        ...prevState,
        gameData: {
            ...prevState.gameData, // Preserve other properties in gameData
            currentBoardStatus: newState.gameData.currentBoardStatus, // Update board status
            status: 'completed', // Mark game as completed
        },
    }));

    try {
        // Prepare updates for the server
        const updates = {
            currentBoardStatus: newState.gameData.currentBoardStatus,
            status: 'completed',
            activePiece: null,
            movedPiece: null,
            originalSquare: null,
            possibleMoves: [],
            possiblePasses: [],
        };

        // Send updates to the server
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
        {Object.entries(gameState.gameData.currentBoardStatus).sort(([keyA], [keyB]) => {
        // Sort keys by row descending, then column ascending
        const rowA = parseInt(keyA[1], 10);
        const rowB = parseInt(keyB[1], 10);
        const colA = keyA.charCodeAt(0);
        const colB = keyB.charCodeAt(0);
        return rowB - rowA || colA - colB; // Sort by row descending, then column ascending
      }).map(([cellKey, cellData]) => {
        const coords = getKeyCoordinates(cellKey);
        console.log(`Cell: ${cellKey}, Row:${coords.row} Column:${coords.col}`);
        const isPossibleMove = gameState.possibleMoves.includes(cellKey);
        const isPossiblePass = gameState.possiblePasses.includes(cellKey);
        let isActivePiece = null;

    if (gameState.activePiece) {
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
  const rotationStyle = localStorage.getItem('userColor') === 'black' ? '180deg' : '0deg';
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
            <Modal>
            <h2>{gameState.winner} wins!</h2>
            <button onClick={() => navigate('/')}>Return to Lobby</button>
          </Modal>
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
