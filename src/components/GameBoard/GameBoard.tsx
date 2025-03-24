import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { GameState } from '../../types/GameState';
import Confetti from 'react-confetti';
import GridCell from '../grid/GridCell/GridCell';
import GridContainer from '../grid/GridContainer/GridContainer';
import Piece from '../piece/Piece';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import Modal from '../modal/modal';
import { updateGame } from '../../services/gameService';
import { getAIMove } from '../../services/aiService';
import { getKeyCoordinates } from '../../utils/gameUtilities';
import { fetchGame, updateGameState } from './helpers';
import './GameBoard.css';

const GameBoard = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>(() => ({
    gameId: gameId ?? '',
    gameType: null,
    currentPlayerTurn: 'white',
    activePiece: null,
    possibleMoves: [],
    movedPiece: null,
    movedPieceOriginalPosition: null,
    possiblePasses: [],
    playerColor: localStorage.getItem('userColor'),
    winner: null,
  }));  
  const isUsersTurn = gameState?.currentPlayerTurn === localStorage.getItem('userColor');
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const isUserWhite = localStorage.getItem('userColor') === 'white';
  const currentPlayerName = gameState
    ? isUserWhite
      ? gameState.whitePlayerName
      : gameState.blackPlayerName
    : 'Loading...';
  const opponentPlayerName = gameState
    ? !isUserWhite
      ? gameState.whitePlayerName
      : gameState.blackPlayerName
    : 'Loading...';

  const pollGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const fetchedGame = await fetchGame(gameId, setGameState);
      console.log('setting gameState');

      setGameState((prevState) => {
        if (JSON.stringify(prevState) === JSON.stringify(fetchedGame)) {
          console.log('⚠️ No change in game data, skipping update.');
          return prevState;
        }
        console.log('✅ Updating game state with backend data.');
        return fetchedGame;
      });
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  }, [gameId]); // ✅ Only re-run when `gameId` changes

  //For polling game for initial Render
  useEffect(() => {
    pollGame();
  }, [gameId, pollGame]);

  //useEffect for polling in multiplayer games
  useEffect(() => {
    if (!gameState || gameState.gameType !== 'multiplayer') return;
  
    if (!gameState.isUserTurn) {
      const newIntervalId: ReturnType<typeof setInterval> = setInterval(pollGame, 3000);
      setIntervalId(newIntervalId);
  
      return () => {
        clearInterval(newIntervalId);
        setIntervalId(null);
      };
    }
  }, [gameState, gameState?.isUserTurn, gameState?.gameType, gameId, pollGame]);  

  useEffect(() => {
    if (
      !gameState ||
      gameState.gameType !== 'singleplayer' ||
      !gameState.gameId ||
      gameState.currentPlayerTurn !== 'white' ||
      gameState.playerColor !== 'black'
    )
      return;
  
    console.log('AI (White) is making the first move...');
    getAIMove(gameState).then((updatedGame) => {
      setGameState(prev => ({
        ...prev,
        ...updatedGame,
        gameId: prev.gameId, // 🔥 ensure we don't lose gameId
      }));
    });
  }, [gameState]);  

  const handleClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const cellKey = event.currentTarget.id;
    const newState = updateGameState(cellKey, gameState);
    console.log('🔥 New State BEFORE updating backend:');
    console.log(newState);
    setGameState(newState);

    if (newState.winner) {
      handleGameEnd(newState);
    }

    try {
      if (!gameId) {
        console.error('gameId is undefined');
        return;
      }
      await updateGame(gameId, newState);
      console.log('✅ Successfully updated backend!');
    } catch (error) {
      console.error('Failed to update game on server:', error);
    }
  };

  const handlePassTurn = async () => {
    const currentPlayerColor = localStorage.getItem('userColor');
    const nextPlayerTurn = currentPlayerColor === 'white' ? 'black' : 'white';
    try {
      let updates;
      if (gameState.gameType === 'multiplayer') {
        console.log('🌍 Multiplayer turn change detected');
        updates = {
          ...gameState,
          currentPlayerTurn: nextPlayerTurn,
          activePiece: null,
          movedPiece: null,
          hasMoved: false,
          possibleMoves: [],
          possiblePasses: [],
        };
      } else {
        console.log('🧠 AI Move requested for singleplayer');
        const aiMove = await getAIMove(gameState);
        setGameState(prev => ({
          ...prev,
          ...aiMove,
          gameId: prev.gameId,
        }));

        console.log('🤖 AI Move response:', JSON.stringify(aiMove, null, 2));

        updates = {
          ...aiMove,
          currentPlayerTurn: currentPlayerColor,
          currentBoardStatus: aiMove.currentBoardStatus,
          hasMoved: false,
        };
      }

      console.log('🔄 Sending updateGame request...');
      if (!gameId) {
        console.error('gameId is undefined');
        return;
      }
      const updatedGame = await updateGame(gameId, updates);
      console.log('✅ Game updated:', JSON.stringify(updatedGame, null, 2));

      setGameState((prevState) => ({
        ...prevState,
        ...updatedGame,
        isUserTurn: updatedGame.currentPlayerTurn === currentPlayerColor,
        activePiece: null,
        movedPiece: null,
        hasMoved: false,
        possibleMoves: [],
        possiblePasses: [],
      }));
    } catch (error) {
      console.error('❌ Failed to update game:', error);
    }
  };

  const handleGameEnd = async (newState: GameState) => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    // Update local game state
    setGameState((prevState) => ({
      ...prevState,
      currentBoardStatus: newState.currentBoardStatus, // Update board status
      status: 'completed', // Mark game as completed
    }));

    try {
      // Prepare updates for the server
      const updates = {
        currentBoardStatus: newState.currentBoardStatus,
        status: 'completed',
        activePiece: null,
        movedPiece: null,
        originalSquare: null,
        possibleMoves: [],
        possiblePasses: [],
      };

      // Send updates to the server
      if (!gameId) {
        console.error('gameId is undefined');
        return;
      }
      await updateGame(gameId, updates);
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  };

  const renderBoard = () => {
    if (!gameState.currentBoardStatus) {
      return <p>Loading game board...</p>;
    }
    return (
      <>
        {Object.entries(gameState.currentBoardStatus)
          .sort(([keyA], [keyB]) => {
            // Sort keys by row descending, then column ascending
            const rowA = parseInt(keyA[1], 10);
            const rowB = parseInt(keyB[1], 10);
            const colA = keyA.charCodeAt(0);
            const colB = keyB.charCodeAt(0);
            return rowB - rowA || colA - colB; // Sort by row descending, then column ascending
          })
          .map(([cellKey, cellData]) => {
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
                highlight={
                  isPossibleMove ? 'red' : isPossiblePass ? 'yellow' : isActivePiece ? 'blue' : null
                }
                id={cellKey}
                onClick={handleClick}
              >
                {cellData && (
                  <Piece
                    color={cellData.color}
                    hasBall={cellData.hasBall}
                    position={cellKey}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.stopPropagation();
                      handleClick(e);
                    }}
                    
                  />
                )}
              </GridCell>
            );
          })}
        {console.log(gameState)}
      </>
    );
  };

  if (!gameState) {
    return <div>Loading game data...</div>;
  }
  const rotationStyle = localStorage.getItem('userColor') === 'black' ? '180deg' : '0deg';
  return (
    <div className="game-container">
      {gameState.status === 'completed' && <Confetti />}
      <PlayerInfoBar playerName={opponentPlayerName} />
      <div className="board-and-info">
        <div className="board-container" style={{ transform: `rotate(${rotationStyle})` }}>
          <div className="board-container">
            <GridContainer>{renderBoard()}</GridContainer>
          </div>
        </div>

        {gameState.status === 'playing' && !isUsersTurn && (
          <Modal>
            <p>It&apos;s not your turn. Please wait for the other player.</p>
          </Modal>
        )}
        {gameState.status === 'completed' && (
          <Modal>
            <h2>{gameState.winner} wins!</h2>
            <button onClick={() => navigate('/')}>Return to Lobby</button>
          </Modal>
        )}
      </div>
      <PlayerInfoBar playerName={currentPlayerName} />
      <button
        onClick={handlePassTurn}
        disabled={!isUsersTurn}
        style={{ alignSelf: 'flex-start', margin: '10px' }}
      >
        Pass Turn
      </button>
    </div>
  );
};

export default GameBoard;
