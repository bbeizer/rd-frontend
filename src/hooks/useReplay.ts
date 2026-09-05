import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { buildReplaySteps } from '@/utils/gameUtilities';
import type { ReplayStep } from '@/utils/gameUtilities';
import type { MoveHistoryEntry } from '@/types/GameSummary';

interface UseReplayProps {
  moveHistory: MoveHistoryEntry[];
  /** Disable keyboard handling (e.g. while the game is still loading). */
  enabled?: boolean;
}

/**
 * Returns true when a keyboard event originated in a text-entry element
 * (chat input, etc.) so replay shortcuts don't hijack typing.
 */
const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

/**
 * In-game replay scrubber. Builds one step per recorded action from
 * moveHistory and tracks which step the user is viewing.
 *
 * `replayIndex === null` means "live" (showing the real board). Stepping
 * back from live lands on the last recorded step, which re-shows the
 * current board with the final action highlighted, then walks backward
 * one action at a time.
 */
export const useReplay = ({ moveHistory, enabled = true }: UseReplayProps) => {
  const steps: ReplayStep[] = useMemo(() => buildReplaySteps(moveHistory), [moveHistory]);

  const [replayIndex, setReplayIndex] = useState<number | null>(null);

  const lastIndex = steps.length - 1;
  const isReplaying = replayIndex !== null;
  // steps[0] is always the starting position; only offer replay once a turn exists
  const hasHistory = steps.length > 1;

  const goLive = useCallback(() => setReplayIndex(null), []);

  const stepBack = useCallback(() => {
    setReplayIndex((current) => {
      if (steps.length <= 1) return current;
      if (current === null) return lastIndex;
      return Math.max(0, current - 1);
    });
  }, [steps.length, lastIndex]);

  const stepForward = useCallback(() => {
    setReplayIndex((current) => {
      if (current === null) return null;
      return current >= lastIndex ? null : current + 1;
    });
  }, [lastIndex]);

  // Mirror replayIndex in a ref so the snap-to-live effect below only runs
  // when the step list itself changes, not on every scrub.
  const replayIndexRef = useRef(replayIndex);
  replayIndexRef.current = replayIndex;

  // When a new update lands, snap back to live only if the user was already
  // viewing the latest step; otherwise leave them where they are.
  const prevLastIndexRef = useRef(lastIndex);
  useEffect(() => {
    const prevLastIndex = prevLastIndexRef.current;
    prevLastIndexRef.current = lastIndex;

    const current = replayIndexRef.current;
    if (current === null || lastIndex === prevLastIndex) return;

    if (current >= prevLastIndex || current > lastIndex) {
      setReplayIndex(null);
    }
  }, [lastIndex]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBack();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'Escape') {
        goLive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, stepBack, stepForward, goLive]);

  const currentStep = isReplaying ? steps[replayIndex] : null;

  return {
    steps,
    replayIndex,
    isReplaying,
    currentStep,
    hasHistory,
    canStepBack: hasHistory && (replayIndex === null || replayIndex > 0),
    canStepForward: isReplaying,
    stepBack,
    stepForward,
    goLive,
  };
};
