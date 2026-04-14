import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById } from '@/services/gameService';
import { reconstructBoardAtTurn } from '@/utils/gameUtilities';
import type { MoveHistoryEntry } from '@/types/GameSummary';
import type { Piece as PieceType } from '@/types/Piece';
import GridCell from '../grid/GridCell/GridCell';
import GridContainer from '../grid/GridContainer/GridContainer';
import Piece from '../piece/Piece';
import './ReplayViewer.css';

interface ReplayGame {
  _id: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
  winner: string | null;
  gameType: 'singleplayer' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  moveHistory: MoveHistoryEntry[];
}

const ReplayViewer = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<ReplayGame | null>(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [boardState, setBoardState] = useState<Record<string, PieceType | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const data = await getGameById(gameId);
        setGame(data as unknown as ReplayGame);
        setBoardState(reconstructBoardAtTurn(data.moveHistory as unknown as MoveHistoryEntry[], 0));
      } catch {
        setError('Failed to load game');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    if (!game) return;
    setBoardState(reconstructBoardAtTurn(game.moveHistory, currentTurn));
  }, [currentTurn, game]);

  const totalTurns = game?.moveHistory.length ?? 0;

  const goToStart = useCallback(() => setCurrentTurn(0), []);
  const goBack = useCallback(() => setCurrentTurn((t) => Math.max(0, t - 1)), []);
  const goForward = useCallback(
    () => setCurrentTurn((t) => Math.min(totalTurns, t + 1)),
    [totalTurns]
  );
  const goToEnd = useCallback(() => setCurrentTurn(totalTurns), [totalTurns]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goBack();
      if (e.key === 'ArrowRight') goForward();
      if (e.key === 'Home') goToStart();
      if (e.key === 'End') goToEnd();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, goForward, goToStart, goToEnd]);

  const getCurrentMoveHighlights = (): Set<string> => {
    if (currentTurn === 0 || !game) return new Set();
    const move = game.moveHistory[currentTurn - 1];
    const squares = new Set<string>();
    if (move.pieceMove) {
      squares.add(move.pieceMove.from);
      squares.add(move.pieceMove.to);
    }
    if (move.ballPass) {
      squares.add(move.ballPass.from);
      squares.add(move.ballPass.to);
    }
    return squares;
  };

  const highlights = getCurrentMoveHighlights();

  const renderBoard = () => {
    const cells = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cellKey = `${String.fromCharCode(97 + col)}${8 - row}`;
        const piece = boardState[cellKey];
        const isHighlighted = highlights.has(cellKey);

        cells.push(
          <GridCell
            key={cellKey}
            row={row}
            col={col}
            id={cellKey}
            data-testid={cellKey}
            highlight={isHighlighted ? 'yellow' : null}
            onClick={() => {}}
          >
            {piece && (
              <Piece
                color={piece.color}
                hasBall={piece.hasBall}
                position={piece.position}
                onClick={() => {}}
              />
            )}
          </GridCell>
        );
      }
    }
    return cells;
  };

  const formatMove = (move: MoveHistoryEntry) => {
    const parts: string[] = [];
    if (move.pieceMove) {
      parts.push(`${move.pieceMove.from} \u2192 ${move.pieceMove.to}`);
    }
    if (move.ballPass) {
      parts.push(`pass ${move.ballPass.from} \u2192 ${move.ballPass.to}`);
    }
    if (parts.length === 0) {
      parts.push('pass turn');
    }
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <div className="replay-page">
        <p>Loading replay...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="replay-page">
        <p>{error || 'Game not found'}</p>
        <button onClick={() => navigate('/profile')} className="replay-back-btn">
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="replay-page">
      <button onClick={() => navigate('/profile')} className="replay-back-btn">
        &larr; Back to Profile
      </button>

      <div className="replay-header">
        <div className="replay-players">
          <span className="replay-player white-label">{game.whitePlayerName || 'White'}</span>
          <span className="replay-vs">vs</span>
          <span className="replay-player black-label">{game.blackPlayerName || 'Black'}</span>
        </div>
        <div className="replay-result">{game.winner} wins</div>
      </div>

      <div className="replay-content">
        <div className="replay-board-wrapper">
          <div className="replay-board">
            <GridContainer>{renderBoard()}</GridContainer>
          </div>

          <div className="replay-controls">
            <button onClick={goToStart} className="replay-control-btn" disabled={currentTurn === 0}>
              |&laquo;
            </button>
            <button onClick={goBack} className="replay-control-btn" disabled={currentTurn === 0}>
              &laquo;
            </button>
            <span className="replay-turn-display">
              Turn {currentTurn} / {totalTurns}
            </span>
            <button
              onClick={goForward}
              className="replay-control-btn"
              disabled={currentTurn === totalTurns}
            >
              &raquo;
            </button>
            <button
              onClick={goToEnd}
              className="replay-control-btn"
              disabled={currentTurn === totalTurns}
            >
              &raquo;|
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={totalTurns}
            value={currentTurn}
            onChange={(e) => setCurrentTurn(Number(e.target.value))}
            className="replay-slider"
          />
        </div>

        <div className="replay-move-list">
          <h3 className="replay-move-list-title">Moves</h3>
          <div className="replay-moves-scroll">
            {game.moveHistory.map((move, idx) => (
              <button
                key={idx}
                className={`replay-move-entry ${idx + 1 === currentTurn ? 'active' : ''}`}
                onClick={() => setCurrentTurn(idx + 1)}
              >
                <span className="replay-move-number">{move.turnNumber}.</span>
                <span className={`replay-move-player ${move.player}`}>
                  {move.player === 'white' ? 'W' : 'B'}
                </span>
                <span className="replay-move-detail">{formatMove(move)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayViewer;
