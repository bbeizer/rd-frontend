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
import { useGameSocket } from '@/hooks/useGameSocket';
import { convertServerGameToGameState } from '@/utils/convertServerGameToGameState';
import { useCallback } from 'react';

const GameBoard = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const userColor = localStorage.getItem('userColor');
  const playerId = localStorage.getItem('guestUserID') || '';

  if (!userColor || !gameId) {
    return <div>Invalid game configuration</div>;
  }

  const { gameState, setGameState, isLoading, error, isUserTurn } = useGameState({
    gameId,
    userColor,
  });

  const handleSocketUpdate = useCallback(
    (gameData: Parameters<typeof convertServerGameToGameState>[0]) => {
      setGameState(convertServerGameToGameState(gameData, userColor as 'white' | 'black'));
    },
    [setGameState, userColor]
  );

  useGameSocket(gameId, handleSocketUpdate);

  const { handleCellClick, handlePassTurn, handleSendMessage, actionError, clearError } =
    useGameActions({
      gameState,
      setGameState,
      userColor,
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

  const isUserWhite = userColor === 'white';
  const currentPlayerName = isUserWhite ? gameState.whitePlayerName : gameState.blackPlayerName;
  const opponentPlayerName = !isUserWhite ? gameState.whitePlayerName : gameState.blackPlayerName;
  const rotationStyle = userColor === 'black' ? '180deg' : '0deg';

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
            disabled={!isUserTurn}
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
