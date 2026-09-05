import { renderHook, act } from '@testing-library/react';
import { useReplay } from '../useReplay';
import type { MoveHistoryEntry } from '@/types/GameSummary';

const turn = (turnNumber: number, player: 'white' | 'black'): MoveHistoryEntry => ({
  turnNumber,
  player,
  pieceMove: player === 'white' ? { from: 'd1', to: 'c3' } : { from: 'e8', to: 'f6' },
  ballPasses: [],
});

const twoTurns: MoveHistoryEntry[] = [turn(1, 'white'), turn(1, 'black')];

const pressKey = (key: string, target?: EventTarget) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  if (target instanceof HTMLElement) {
    target.dispatchEvent(event);
  } else {
    window.dispatchEvent(event);
  }
};

describe('useReplay', () => {
  it('starts live and offers no replay for an empty history', () => {
    const { result } = renderHook(() => useReplay({ moveHistory: [] }));

    expect(result.current.isReplaying).toBe(false);
    expect(result.current.hasHistory).toBe(false);
    expect(result.current.canStepBack).toBe(false);

    act(() => result.current.stepBack());
    expect(result.current.isReplaying).toBe(false);
  });

  it('steps back from live onto the last recorded action, then backward one action at a time', () => {
    const { result } = renderHook(() => useReplay({ moveHistory: twoTurns }));
    // steps: [start, white move, black move]

    act(() => result.current.stepBack());
    expect(result.current.isReplaying).toBe(true);
    expect(result.current.replayIndex).toBe(2);
    expect(result.current.currentStep?.player).toBe('black');

    act(() => result.current.stepBack());
    expect(result.current.replayIndex).toBe(1);
    expect(result.current.currentStep?.player).toBe('white');

    act(() => result.current.stepBack());
    expect(result.current.replayIndex).toBe(0);
    expect(result.current.currentStep?.actionType).toBe('start');

    // Clamped at the start
    act(() => result.current.stepBack());
    expect(result.current.replayIndex).toBe(0);
  });

  it('stepping forward past the last action returns to live', () => {
    const { result } = renderHook(() => useReplay({ moveHistory: twoTurns }));

    act(() => result.current.stepBack());
    act(() => result.current.stepBack());
    expect(result.current.replayIndex).toBe(1);

    act(() => result.current.stepForward());
    expect(result.current.replayIndex).toBe(2);

    act(() => result.current.stepForward());
    expect(result.current.isReplaying).toBe(false);
    expect(result.current.currentStep).toBeNull();
  });

  it('responds to arrow keys and Escape', () => {
    const { result } = renderHook(() => useReplay({ moveHistory: twoTurns }));

    act(() => pressKey('ArrowLeft'));
    expect(result.current.replayIndex).toBe(2);

    act(() => pressKey('ArrowLeft'));
    expect(result.current.replayIndex).toBe(1);

    act(() => pressKey('ArrowRight'));
    expect(result.current.replayIndex).toBe(2);

    act(() => pressKey('Escape'));
    expect(result.current.isReplaying).toBe(false);
  });

  it('ignores arrow keys while typing in an input (chat)', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const { result } = renderHook(() => useReplay({ moveHistory: twoTurns }));

    act(() => pressKey('ArrowLeft', input));
    expect(result.current.isReplaying).toBe(false);

    document.body.removeChild(input);
  });

  it('ignores keys when disabled', () => {
    const { result } = renderHook(() => useReplay({ moveHistory: twoTurns, enabled: false }));

    act(() => pressKey('ArrowLeft'));
    expect(result.current.isReplaying).toBe(false);
  });

  it('snaps to live when a new turn arrives while viewing the latest step', () => {
    const { result, rerender } = renderHook(
      ({ moveHistory }: { moveHistory: MoveHistoryEntry[] }) => useReplay({ moveHistory }),
      { initialProps: { moveHistory: twoTurns } }
    );

    // Step back once: viewing the last recorded step (the "end")
    act(() => result.current.stepBack());
    expect(result.current.replayIndex).toBe(2);

    rerender({ moveHistory: [...twoTurns, turn(2, 'white')] });
    expect(result.current.isReplaying).toBe(false);
  });

  it('stays put when a new turn arrives while reviewing an earlier step', () => {
    const { result, rerender } = renderHook(
      ({ moveHistory }: { moveHistory: MoveHistoryEntry[] }) => useReplay({ moveHistory }),
      { initialProps: { moveHistory: twoTurns } }
    );

    act(() => result.current.stepBack());
    act(() => result.current.stepBack());
    expect(result.current.replayIndex).toBe(1);

    rerender({ moveHistory: [...twoTurns, turn(2, 'white')] });
    expect(result.current.isReplaying).toBe(true);
    expect(result.current.replayIndex).toBe(1);
  });

  it('builds one step per action so AI pass chains replay pass-by-pass', () => {
    const aiTurn: MoveHistoryEntry = {
      turnNumber: 2,
      player: 'black',
      pieceMove: { from: 'd8', to: 'c6' },
      ballPasses: [
        { from: 'e8', to: 'f8' },
        { from: 'f8', to: 'c6' },
      ],
    };
    const { result } = renderHook(() => useReplay({ moveHistory: [turn(1, 'white'), aiTurn] }));

    // steps: start, white move, black move, pass 1, pass 2
    expect(result.current.steps).toHaveLength(5);
    expect(result.current.steps.map((s) => s.actionType)).toEqual([
      'start',
      'move',
      'move',
      'pass',
      'pass',
    ]);
  });
});
