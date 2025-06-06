import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { GameState } from '@/types/GameState';
import type { ServerGame } from '@/types/ServerGame';
import { convertServerGameToGameState } from '@/utils/convertServerGameToGameState';
import Confetti from 'react-confetti';
import GridCell from '../grid/GridCell/GridCell';
import GridContainer from '../grid/GridContainer/GridContainer';
import Piece from '../piece/Piece';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import Modal from '../modal/modal';
import { updateGame } from '@/services/gameService';
import { getAIMove } from '@/services/aiService';
import { getKeyCoordinates } from '@/utils/gameUtilities';
import { fetchGame, updateGameState } from './helpers';
import './GameBoard.css';
import ChatBox from '../ChatBox/ChatBox';
import { MessageProps } from '../Message/Message';


const GameBoard = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>(() => ({
    gameId: gameId ?? '',
    gameType: null,
    currentPlayerTurn: 'white',
    activePiece: null,
    possibleMoves: [],
    conversation: [],
    movedPiece: null,
    movedPieceOriginalPosition: null,
    possiblePasses: [],
    hasMoved: false,
    originalSquare: null,
    currentBoardStatus: {},
    playerColor: localStorage.getItem('userColor'),
    winner: null,
  }));
  const userColor = localStorage.getItem('userColor');
  const aiColor = userColor === 'white' ? 'black' : 'white';
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
      const convertedGame = convertServerGameToGameState(fetchedGame, localStorage.getItem('userColor') as 'white' | 'black');

      setGameState((prevState) => {
        if (JSON.stringify(prevState) === JSON.stringify(convertedGame)) {
          console.log('⚠️ No change in game data, skipping update.');
          return prevState;
        }
        console.log('✅ Updating game state with backend data.');
        return {
          ...convertedGame,
          conversation: convertedGame?.conversation || [],
        };
      });
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  }, [gameId]);

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
    const userColor = localStorage.getItem('userColor');
    const aiColor = userColor === 'white' ? 'black' : 'white';
    console.log('🧠 useEffect triggered');
    console.log(gameState)
    console.log('🔍 gameState snapshot:', {
      gameId: gameState?.gameId,
      gameType: gameState?.gameType,
      currentPlayerTurn: gameState?.currentPlayerTurn,
    });
    if (!gameState?.gameId || !gameState?.gameType || !gameState?.currentPlayerTurn) {
      console.log('⏳ Waiting for full gameState...');
      return;
    }

    if (gameState.gameType === 'singleplayer' && gameState.currentPlayerTurn === aiColor) {
      console.log(`🤖 AI (${aiColor}) making a move...`);
      aiColor
      getAIMove(gameState, aiColor).then((updatedGame) => {
        setGameState((prev) => ({
          ...prev,
          ...updatedGame,
        }));
      });
    } else {
      console.log("🚫 Conditions not met for AI move");
      console.log("gameId:", gameState?.gameId);
      console.log("gameType:", gameState?.gameType);
      console.log("currentPlayerTurn:", gameState?.currentPlayerTurn);
    }
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
        const aiMove = await getAIMove(gameState, aiColor);

        setGameState((prev) => ({
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

      const updatedGame = await updateGame<ServerGame>(gameId, updates);

      if (updatedGame.success) {
        const updatedGameState = convertServerGameToGameState(updatedGame.data);

        console.log('✅ Game updated:', JSON.stringify(updatedGameState, null, 2));

        setGameState((prevState) => ({
          ...prevState,
          ...updatedGameState,
          isUserTurn: updatedGameState.currentPlayerTurn === currentPlayerColor,
          activePiece: null,
          movedPiece: null,
          hasMoved: false,
          possibleMoves: [],
          possiblePasses: [],
        }));
      } else {
        console.error('Failed to update game:', updatedGame.error);
      }
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

  const handleSendMessage = async (newMessage: MessageProps) => {
    // Optimistically update local game state
    setGameState(prev => ({
      ...prev,
      conversation: [...(prev.conversation || []), newMessage]
    }));

    try {
      if (!gameId) {
        console.error('gameId is undefined');
        return;
      }
      await updateGame(gameId, {
        newMessage: {
          author: newMessage.author,
          text: newMessage.text,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      // Optional: rollback UI or show an error toast
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
    <>
      <div className="game-container">
        {gameState.status === 'completed' && <Confetti />}
        <div className="board-wrapper">
          {/* Board + Button grouped together */}
          <div className="board-column">
            <div className="player-info top-player">
              <PlayerInfoBar playerName={opponentPlayerName ?? 'Opponent'} />
            </div>
            <div className="board-container" style={{ transform: `rotate(${rotationStyle})` }}>
              <GridContainer>{renderBoard()}</GridContainer>
              {/* Modals */}
              {gameState.status === 'playing' && !isUsersTurn && (
                <Modal >
                  <div style={{ transform: `rotate(${rotationStyle})` }}>
                    <p>It&apos;s not your turn. Please wait for the other player.</p>
                  </div>
                </Modal>
              )}
              {gameState.status === 'completed' && (
                <Modal>
                  <div style={{ transform: `rotate(${rotationStyle})` }}>
                    <h2>{gameState.winner} wins!</h2>
                    <button onClick={() => navigate('/')}>Return to Lobby</button>
                  </div>
                </Modal>
              )}
            </div>
            <div className="player-info bottom-player">
              <PlayerInfoBar playerName={currentPlayerName ?? 'You'} />
            </div>

            <button
              onClick={handlePassTurn}
              disabled={!isUsersTurn}
              className="pass-turn-btn"
            >
              Pass Turn
            </button>

          </div>

          {/* Only show chat in multiplayer */}
          {gameState.gameType === 'multiplayer' && (
            <ChatBox
              messages={gameState.conversation || []}
              onSendMessage={handleSendMessage}
              currentUserName={currentPlayerName ?? 'You'}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default GameBoard;
