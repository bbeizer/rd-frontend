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
import { useAuth } from '@/hooks/useAuth';
import { useReplay } from '@/hooks/useReplay';

type RematchStatus = 'idle' | 'waiting' | 'opponent-requested' | 'declined';

const GameBoard = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userColor = localStorage.getItem('userColor');
  const playerId = isAuthenticated && user ? user._id : localStorage.getItem('guestUserID') || '';

  // Rematch state
  const [rematchStatus, setRematchStatus] = useState<RematchStatus>('idle');
  const [rematchMessage, setRematchMessage] = useState<string | null>(null);

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

  const {
    handleCellClick,
    handlePassTurn,
    handleSendMessage,
    actionError,
    clearError,
    isProcessingAction,
  } = useGameActions({
    gameState,
    setGameState,
    userColor: gameState.playerColor,
    playerId,
  });

  const { isReplaying, currentStep, canStepBack, canStepForward, stepBack, stepForward, goLive } =
    useReplay({
      moveHistory: gameState.moveHistory ?? [],
      enabled: !isLoading && !error,
    });

  const totalTurns = useMemo(() => {
    const history = gameState.moveHistory ?? [];
    return history.length > 0 ? history[history.length - 1].turnNumber : 0;
  }, [gameState.moveHistory]);

  // AI "thinking" inference: in singleplayer the AI's reply arrives either in
  // the awaited action response or via a later gameUpdated, so the pending
  // window is "action in flight OR it's the AI's turn". Delay the indicator
  // slightly so instant actions (piece selection, easy AI) don't flash it.
  const aiTurnPending =
    gameState.gameType === 'singleplayer' &&
    gameState.status === 'playing' &&
    !gameState.winner &&
    (isProcessingAction || !isUserTurn);

  const [showThinking, setShowThinking] = useState(false);
  useEffect(() => {
    if (!aiTurnPending) {
      setShowThinking(false);
      return;
    }
    const timer = setTimeout(() => setShowThinking(true), 400);
    return () => clearTimeout(timer);
  }, [aiTurnPending]);

  const waitingForOpponent =
    gameState.gameType === 'multiplayer' && gameState.status === 'playing' && !isUserTurn;

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

  // While replaying, render the historical snapshot and block move input.
  const displayedBoard =
    isReplaying && currentStep ? currentStep.board : gameState.currentBoardStatus;

  const renderBoard = () => {
    if (!displayedBoard) {
      return <p>Loading game board...</p>;
    }

    return Object.entries(displayedBoard)
      .sort(([keyA], [keyB]) => {
        const rowA = parseInt(keyA[1], 10);
        const rowB = parseInt(keyB[1], 10);
        const colA = keyA.charCodeAt(0);
        const colB = keyB.charCodeAt(0);
        return rowB - rowA || colA - colB;
      })
      .map(([cellKey, cellData]) => {
        let highlight: 'red' | 'yellow' | 'blue' | null;
        if (isReplaying) {
          highlight = currentStep?.highlights[cellKey] ?? null;
        } else {
          const isPossibleMove = gameState.possibleMoves.includes(cellKey);
          const isPossiblePass = gameState.possiblePasses.includes(cellKey);
          const isActivePiece = gameState.activePiece?.position === cellKey;
          highlight = isPossibleMove
            ? 'red'
            : isPossiblePass
              ? 'yellow'
              : isActivePiece
                ? 'blue'
                : null;
        }

        const onCellClick = () => {
          if (!isReplaying) handleCellClick(cellKey);
        };

        return (
          <GridCell
            key={cellKey}
            id={cellKey}
            data-testid={cellKey}
            row={parseInt(cellKey[1], 10) - 1}
            col={cellKey.charCodeAt(0) - 'a'.charCodeAt(0)}
            highlight={highlight}
            onClick={onCellClick}
          >
            {cellData && (
              <Piece
                color={cellData.color}
                hasBall={cellData.hasBall}
                position={cellKey}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation();
                  onCellClick();
                }}
              />
            )}
          </GridCell>
        );
      });
  };

  return (
    <div className="game-container">
      {gameState.status === 'completed' && <Confetti />}

      {/* Action error toast */}
      {actionError && (
        <button type="button" className="action-error-toast" onClick={clearError}>
          {actionError}
          <span className="close-btn">&times;</span>
        </button>
      )}

      <div className="board-wrapper">
        <div className="board-column">
          <div className={`player-info top-player ${showThinking ? 'thinking' : ''}`}>
            <PlayerInfoBar playerName={opponentPlayerName ?? 'Opponent'} />
            {showThinking && (
              <div className="opponent-status-chip" data-testid="thinking-indicator">
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                thinking…
              </div>
            )}
            {waitingForOpponent && isReplaying && (
              <div className="opponent-status-chip" data-testid="waiting-indicator">
                waiting for opponent…
              </div>
            )}
          </div>

          <div
            className={`board-container ${isReplaying ? 'replay-mode' : ''}`}
            data-testid="board-container"
            style={{ transform: `rotate(${rotationStyle})` }}
          >
            <GridContainer>{renderBoard()}</GridContainer>

            {/* Modals */}
            {gameState.status === 'playing' && !isUserTurn && !isReplaying && (
              <Modal>
                <div style={{ transform: `rotate(${rotationStyle})` }}>
                  <p>It&apos;s not your turn. Please wait for the other player.</p>
                </div>
              </Modal>
            )}

            {gameState.status === 'completed' && (
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
                      onClick={() => navigate(`/game/${gameId}/replay`)}
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

          <div className="replay-bar" data-testid="replay-bar">
            <button
              onClick={stepBack}
              disabled={!canStepBack}
              className="replay-nav-btn"
              aria-label="Step back"
            >
              &#9664;
            </button>
            {isReplaying && currentStep ? (
              <div className="replay-status replaying" data-testid="replay-status">
                <span className="replay-status-label">
                  {currentStep.actionType === 'start'
                    ? 'Reviewing start'
                    : `Reviewing turn ${currentStep.turnNumber} of ${totalTurns}`}
                </span>
                <span className="replay-status-detail">{currentStep.description}</span>
              </div>
            ) : (
              <div className="replay-status live" data-testid="replay-status">
                <span className="live-dot" />
                Live
              </div>
            )}
            <button
              onClick={stepForward}
              disabled={!canStepForward}
              className="replay-nav-btn"
              aria-label="Step forward"
            >
              &#9654;
            </button>
            {isReplaying && (
              <button onClick={goLive} className="replay-live-btn">
                Return to live (Esc)
              </button>
            )}
          </div>

          <div className="player-info bottom-player">
            <PlayerInfoBar playerName={currentPlayerName ?? 'You'} />
          </div>

          <button
            onClick={handlePassTurn}
            disabled={!isUserTurn || isReplaying}
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
  );
};

export default GameBoard;
