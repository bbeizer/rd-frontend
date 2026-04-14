import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById } from '@/services/gameService';
import { buildReplaySteps } from '@/utils/gameUtilities';
import type { MoveHistoryEntry } from '@/types/GameSummary';
import type { ReplayStep } from '@/utils/gameUtilities';
interface TurnGroup {
  turnIndex: number;
  turnNumber: number;
  player: string;
  steps: { stepIndex: number; step: ReplayStep }[];
}

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeStepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const data = await getGameById(gameId);
        setGame(data as unknown as ReplayGame);
      } catch {
        setError('Failed to load game');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  const steps: ReplayStep[] = useMemo(() => {
    if (!game) return [];
    return buildReplaySteps(game.moveHistory);
  }, [game]);

  const totalSteps = steps.length - 1; // exclude step 0 (start) from max

  const goToStart = useCallback(() => setCurrentStep(0), []);
  const goBack = useCallback(() => setCurrentStep((s) => Math.max(0, s - 1)), []);
  const goForward = useCallback(
    () => setCurrentStep((s) => Math.min(totalSteps, s + 1)),
    [totalSteps]
  );
  const goToEnd = useCallback(() => setCurrentStep(totalSteps), [totalSteps]);

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

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentStep]);

  const step = steps[currentStep];

  // Group steps by turn for the move list sidebar
  const turnGroups = useMemo(() => {
    const groups: TurnGroup[] = [];
    for (let i = 1; i < steps.length; i++) {
      const s = steps[i];
      const last = groups[groups.length - 1];
      if (last && last.turnIndex === s.turnIndex) {
        last.steps.push({ stepIndex: i, step: s });
      } else {
        groups.push({
          turnIndex: s.turnIndex,
          turnNumber: s.turnNumber,
          player: s.player,
          steps: [{ stepIndex: i, step: s }],
        });
      }
    }
    return groups;
  }, [steps]);

  const renderBoard = () => {
    if (!step) return null;
    const cells = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cellKey = `${String.fromCharCode(97 + col)}${8 - row}`;
        const piece = step.board[cellKey];
        const highlight = step.highlights[cellKey] ?? null;

        cells.push(
          <GridCell
            key={cellKey}
            row={row}
            col={col}
            id={cellKey}
            data-testid={cellKey}
            highlight={highlight}
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
            <button onClick={goToStart} className="replay-control-btn" disabled={currentStep === 0}>
              |&laquo;
            </button>
            <button onClick={goBack} className="replay-control-btn" disabled={currentStep === 0}>
              &laquo;
            </button>
            <span className="replay-turn-display">
              {step?.actionType === 'start' ? 'Start' : `Turn ${step?.turnNumber ?? 0}`}
            </span>
            <button
              onClick={goForward}
              className="replay-control-btn"
              disabled={currentStep === totalSteps}
            >
              &raquo;
            </button>
            <button
              onClick={goToEnd}
              className="replay-control-btn"
              disabled={currentStep === totalSteps}
            >
              &raquo;|
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={totalSteps}
            value={currentStep}
            onChange={(e) => setCurrentStep(Number(e.target.value))}
            className="replay-slider"
          />
        </div>

        <div className="replay-move-list">
          <h3 className="replay-move-list-title">Moves</h3>
          <div className="replay-moves-scroll">
            {turnGroups.map((group) => (
              <div key={group.turnIndex} className="replay-turn-group">
                <div className="replay-turn-header">
                  <span className="replay-move-number">{group.turnNumber}.</span>
                  <span className={`replay-move-player ${group.player}`}>
                    {group.player === 'white' ? 'W' : 'B'}
                  </span>
                </div>
                {group.steps.map(({ stepIndex, step: s }) => (
                  <button
                    key={stepIndex}
                    ref={stepIndex === currentStep ? activeStepRef : undefined}
                    className={`replay-step-entry ${stepIndex === currentStep ? 'active' : ''} replay-step-${s.actionType}`}
                    onClick={() => setCurrentStep(stepIndex)}
                  >
                    <span className={`replay-step-icon ${s.actionType}`}>
                      {s.actionType === 'move' ? '\u265E' : s.actionType === 'pass' ? '\u25CF' : ''}
                    </span>
                    <span className="replay-step-detail">{s.description}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayViewer;
