import { useParams, useNavigate } from 'react-router-dom';
import { useGameState } from '../../hooks/useGameState';
import { useGameActions } from '../../hooks/useGameActions';
import Confetti from 'react-confetti';
import GridCell from '../grid/GridCell/GridCell';
import GridContainer from '../grid/GridContainer/GridContainer';
import Piece from '../piece/Piece';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import Modal from '../modal/modal';
import ChatBox from '../ChatBox/ChatBox';
import './GameBoard.css';
import { useGameSocket, RematchEvents } from '@/hooks/useGameSocket';
import {
  convertServerGameToGameState,
  derivePlayerColor,
} from '@/utils/convertServerGameToGameState';
import { useCallback, useState, useMemo, useEffect } from 'react';
import { requestRematch, declineRematch } from '@/services/gameService';

type RematchStatus = 'idle' | 'waiting' | 'opponent-requested' | 'declined';

const GameBoard = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const userColor = localStorage.getItem('userColor');
  const playerId = localStorage.getItem('guestUserID') || '';

  // Rematch state
  const [rematchStatus, setRematchStatus] = useState<RematchStatus>('idle');
  const [rematchMessage, setRematchMessage] = useState<string | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(true);

  if (!gameId) {
    return <div>Invalid game configuration</div>;
  }

  const { gameState, setGameState, isLoading, error, isUserTurn } = useGameState({
    gameId,
    userColor,
    playerId,
  });

  const handleSocketUpdate = useCallback(
    (gameData: Parameters<typeof convertServerGameToGameState>[0]) => {
      const derivedColor = derivePlayerColor(gameData, playerId);
      setGameState(convertServerGameToGameState(gameData, derivedColor));
    },
    [setGameState, playerId]
  );

  // Rematch socket event handlers
  const rematchEvents: RematchEvents = useMemo(
    () => ({
      onRematchRequested: () => {
        setRematchStatus('opponent-requested');
        setRematchMessage(null);
      },
      onRematchDeclined: () => {
        setRematchStatus('declined');
        setRematchMessage('Opponent declined the rematch');
        setTimeout(() => {
          setRematchStatus('idle');
          setRematchMessage(null);
        }, 3000);
      },
      onRematchReady: ({ newGameId }) => {
        navigate(`/game/${newGameId}`);
      },
    }),
    [navigate]
  );

  useGameSocket(gameId, handleSocketUpdate, rematchEvents);

  // Check for existing rematch game on mount (reconnect scenario)
  useEffect(() => {
    if (gameState.rematchGameId) {
      navigate(`/game/${gameState.rematchGameId}`);
    }
  }, [gameState.rematchGameId, navigate]);

  // Initialize rematch status from game state (e.g., page refresh)
  useEffect(() => {
    if (gameState.status === 'completed' && gameState.playerColor) {
      const userWantsRematch =
        gameState.playerColor === 'white'
          ? gameState.whiteWantsRematch
          : gameState.blackWantsRematch;
      const opponentWantsRematch =
        gameState.playerColor === 'white'
          ? gameState.blackWantsRematch
          : gameState.whiteWantsRematch;

      if (userWantsRematch && !opponentWantsRematch) {
        setRematchStatus('waiting');
      } else if (opponentWantsRematch && !userWantsRematch) {
        setRematchStatus('opponent-requested');
      }
    }
  }, [
    gameState.status,
    gameState.whiteWantsRematch,
    gameState.blackWantsRematch,
    gameState.playerColor,
  ]);

  // Rematch handlers
  const handleRequestRematch = async () => {
    const result = await requestRematch(gameId, playerId);
    if (result.success && result.data) {
      // Single player: immediate redirect
      if (result.data.rematchGameId) {
        navigate(`/game/${result.data.rematchGameId}`);
      } else {
        // Multiplayer: waiting for opponent
        setRematchStatus('waiting');
      }
    }
  };

  const handleAcceptRematch = async () => {
    const result = await requestRematch(gameId, playerId);
    if (result.success && result.data?.rematchGameId) {
      navigate(`/game/${result.data.rematchGameId}`);
    }
  };

  const handleDeclineRematch = async () => {
    await declineRematch(gameId, playerId);
    setRematchStatus('idle');
  };

  const { handleCellClick, handlePassTurn, handleSendMessage, actionError, clearError } =
    useGameActions({
      gameState,
      setGameState,
      userColor: gameState.playerColor,
      playerId,
    });

  // Loading state
  if (isLoading) {
    return <div className="loading">Loading game...</div>;
  }

  // Error state
  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  // Game not found
  if (!gameState) {
    return <div>Game not found</div>;
  }

  const isUserWhite = gameState.playerColor === 'white';
  const currentPlayerName = isUserWhite ? gameState.whitePlayerName : gameState.blackPlayerName;
  const opponentPlayerName = !isUserWhite ? gameState.whitePlayerName : gameState.blackPlayerName;
  const rotationStyle = gameState.playerColor === 'black' ? '180deg' : '0deg';

  const renderBoard = () => {
    if (!gameState.currentBoardStatus) {
      return <p>Loading game board...</p>;
    }

    return Object.entries(gameState.currentBoardStatus)
      .sort(([keyA], [keyB]) => {
        const rowA = parseInt(keyA[1], 10);
        const rowB = parseInt(keyB[1], 10);
        const colA = keyA.charCodeAt(0);
        const colB = keyB.charCodeAt(0);
        return rowB - rowA || colA - colB;
      })
      .map(([cellKey, cellData]) => {
        const isPossibleMove = gameState.possibleMoves.includes(cellKey);
        const isPossiblePass = gameState.possiblePasses.includes(cellKey);
        const isActivePiece = gameState.activePiece?.position === cellKey;

        return (
          <GridCell
            key={cellKey}
            id={cellKey}
            data-testid={cellKey}
            row={parseInt(cellKey[1], 10) - 1}
            col={cellKey.charCodeAt(0) - 'a'.charCodeAt(0)}
            highlight={
              isPossibleMove ? 'red' : isPossiblePass ? 'yellow' : isActivePiece ? 'blue' : null
            }
            onClick={() => handleCellClick(cellKey)}
          >
            {cellData && (
              <Piece
                color={cellData.color}
                hasBall={cellData.hasBall}
                position={cellKey}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation();
                  handleCellClick(cellKey);
                }}
              />
            )}
          </GridCell>
        );
      });
  };

  return (
    <div className="game-container">
      {gameState.status === 'completed' && showGameOverModal && <Confetti />}

      {gameState.status === 'completed' && !showGameOverModal && (
        <button
          onClick={() => navigate('/')}
          className="back-to-lobby-btn"
        >
          &larr; Back to Lobby
        </button>
      )}

      {/* Action error toast */}
      {actionError && (
        <button type="button" className="action-error-toast" onClick={clearError}>
          {actionError}
          <span className="close-btn">&times;</span>
        </button>
      )}

      <div className="board-wrapper">
        <div className="board-column">
          <div className="player-info top-player">
            <PlayerInfoBar playerName={opponentPlayerName ?? 'Opponent'} />
          </div>

          <div
            className="board-container"
            data-testid="board-container"
            style={{ transform: `rotate(${rotationStyle})` }}
          >
            <GridContainer>{renderBoard()}</GridContainer>

            {/* Modals */}
            {gameState.status === 'playing' && !isUserTurn && (
              <Modal>
                <div style={{ transform: `rotate(${rotationStyle})` }}>
                  <p>It&apos;s not your turn. Please wait for the other player.</p>
                </div>
              </Modal>
            )}

            {gameState.status === 'completed' && showGameOverModal && (
              <Modal>
                <div style={{ transform: `rotate(${rotationStyle})` }}>
                  <h2>{gameState.winner} wins!</h2>

                  {rematchMessage && <p className="rematch-message">{rematchMessage}</p>}

                  <div className="game-over-buttons">
                    {rematchStatus === 'idle' && (
                      <button onClick={handleRequestRematch} className="rematch-btn">
                        Rematch
                      </button>
                    )}

                    {rematchStatus === 'waiting' && (
                      <button disabled className="rematch-btn waiting">
                        Waiting for opponent...
                      </button>
                    )}

                    {rematchStatus === 'opponent-requested' && (
                      <>
                        <p>Opponent wants a rematch!</p>
                        <button onClick={handleAcceptRematch} className="rematch-btn accept">
                          Accept
                        </button>
                        <button onClick={handleDeclineRematch} className="rematch-btn decline">
                          Decline
                        </button>
                      </>
                    )}

                    {rematchStatus === 'declined' && (
                      <button disabled className="rematch-btn">
                        Rematch
                      </button>
                    )}

                    <button
                      onClick={() => setShowGameOverModal(false)}
                      className="lobby-btn"
                    >
                      View Board
                    </button>

                    <button onClick={() => navigate('/')} className="lobby-btn">
                      Return to Lobby
                    </button>
                  </div>
                </div>
              </Modal>
            )}
          </div>

          <div className="player-info bottom-player">
            <PlayerInfoBar playerName={currentPlayerName ?? 'You'} />
          </div>

          <button onClick={handlePassTurn} disabled={!isUserTurn} className="pass-turn-btn">
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
  );
};

export default GameBoard;
