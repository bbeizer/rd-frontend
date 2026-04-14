import { buildReplaySteps } from '../gameUtilities';
import type { Piece } from '@/types/Piece';

const countBalls = (board: Record<string, Piece | null>, color: 'white' | 'black'): number =>
  Object.values(board).filter((p) => p?.color === color && p.hasBall).length;

const ballHolder = (
  board: Record<string, Piece | null>,
  color: 'white' | 'black'
): string | null => {
  for (const [, p] of Object.entries(board)) {
    if (p?.color === color && p.hasBall) return p.position;
  }
  return null;
};

describe('buildReplaySteps', () => {
  it('returns a single start step for empty history', () => {
    const steps = buildReplaySteps([]);
    expect(steps).toHaveLength(1);
    expect(steps[0].actionType).toBe('start');
    expect(countBalls(steps[0].board, 'white')).toBe(1);
    expect(countBalls(steps[0].board, 'black')).toBe(1);
  });

  it('creates separate steps for move and pass', () => {
    const steps = buildReplaySteps([
      {
        turnNumber: 1,
        player: 'white',
        pieceMove: { from: 'd1', to: 'c3' },
        ballPasses: [{ from: 'c3', to: 'e1' }],
      },
    ]);

    // start + move + pass = 3 steps
    expect(steps).toHaveLength(3);

    expect(steps[0].actionType).toBe('start');

    // Step 1: piece move
    expect(steps[1].actionType).toBe('move');
    expect(steps[1].description).toContain('d1');
    expect(steps[1].description).toContain('c3');
    expect(steps[1].highlights['d1']).toBe('blue');
    expect(steps[1].highlights['c3']).toBe('red');
    // Ball is still on c3 (moved with piece) — not yet passed
    expect(ballHolder(steps[1].board, 'white')).toBe('c3');

    // Step 2: ball pass
    expect(steps[2].actionType).toBe('pass');
    expect(steps[2].highlights['c3']).toBe('yellow');
    expect(steps[2].highlights['e1']).toBe('yellow');
    expect(ballHolder(steps[2].board, 'white')).toBe('e1');
  });

  it('creates multiple pass steps for a chain', () => {
    const steps = buildReplaySteps([
      {
        turnNumber: 1,
        player: 'white',
        pieceMove: { from: 'd1', to: 'c3' },
        ballPasses: [
          { from: 'c3', to: 'e1' },
          { from: 'e1', to: 'f1' },
        ],
      },
    ]);

    // start + move + pass1 + pass2 = 4 steps
    expect(steps).toHaveLength(4);

    expect(steps[1].actionType).toBe('move');
    expect(steps[2].actionType).toBe('pass');
    expect(steps[3].actionType).toBe('pass');

    expect(ballHolder(steps[1].board, 'white')).toBe('c3');
    expect(ballHolder(steps[2].board, 'white')).toBe('e1');
    expect(ballHolder(steps[3].board, 'white')).toBe('f1');
  });

  it('handles pass-turn (no actions)', () => {
    const steps = buildReplaySteps([{ turnNumber: 1, player: 'white' }]);

    expect(steps).toHaveLength(2); // start + pass turn
    expect(steps[1].description).toBe('pass turn');
    expect(Object.keys(steps[1].highlights)).toHaveLength(0);
  });

  it('maintains ball invariant across all steps', () => {
    const steps = buildReplaySteps([
      {
        turnNumber: 1,
        player: 'white',
        pieceMove: { from: 'd1', to: 'c3' },
        ballPasses: [{ from: 'c3', to: 'e1' }],
      },
      {
        turnNumber: 2,
        player: 'black',
        pieceMove: { from: 'e8', to: 'd6' },
        ballPasses: [
          { from: 'd6', to: 'f8' },
          { from: 'f8', to: 'c8' },
        ],
      },
    ]);

    for (const step of steps) {
      expect(countBalls(step.board, 'white')).toBe(1);
      expect(countBalls(step.board, 'black')).toBe(1);
    }
  });

  it('groups steps by turn correctly', () => {
    const steps = buildReplaySteps([
      {
        turnNumber: 1,
        player: 'white',
        pieceMove: { from: 'd1', to: 'c3' },
        ballPasses: [{ from: 'c3', to: 'e1' }],
      },
      {
        turnNumber: 2,
        player: 'black',
        pieceMove: { from: 'e8', to: 'd6' },
      },
    ]);

    // Turn 1 steps should all have turnIndex 0
    expect(steps[1].turnIndex).toBe(0);
    expect(steps[2].turnIndex).toBe(0);
    // Turn 2 step should have turnIndex 1
    expect(steps[3].turnIndex).toBe(1);
  });

  it('uses boardSnapshot as starting point for next turn', () => {
    // Provide a snapshot on turn 1 that differs from what delta would produce.
    // Turn 2 should start from the snapshot, not from delta.
    const snapshotBoard: Record<
      string,
      { color: string; hasBall: boolean; position: string } | null
    > = {};
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cellKey = `${String.fromCharCode(97 + col)}${8 - row}`;
        snapshotBoard[cellKey] = null;
      }
    }
    // Snapshot places pieces in unusual positions
    snapshotBoard['a1'] = { color: 'white', hasBall: true, position: 'a1' };
    snapshotBoard['b1'] = { color: 'white', hasBall: false, position: 'b1' };
    snapshotBoard['h8'] = { color: 'black', hasBall: true, position: 'h8' };
    snapshotBoard['g8'] = { color: 'black', hasBall: false, position: 'g8' };

    const steps = buildReplaySteps([
      {
        turnNumber: 1,
        player: 'white',
        pieceMove: { from: 'd1', to: 'c3' },
        boardSnapshot: snapshotBoard,
      },
      {
        turnNumber: 2,
        player: 'black',
        // Pass from h8 to g8 — only valid if snapshot was used
        ballPasses: [{ from: 'h8', to: 'g8' }],
      },
    ]);

    // Last step is the pass on turn 2 — should use snapshot positions
    const lastStep = steps[steps.length - 1];
    expect(lastStep.board['h8']?.hasBall).toBe(false);
    expect(lastStep.board['g8']?.hasBall).toBe(true);
    // White ball holder should be a1 (from snapshot, not c3 from delta)
    expect(lastStep.board['a1']?.hasBall).toBe(true);
  });

  it('handles turns with only ballPasses and no pieceMove', () => {
    // First turn moves a piece so ball holder is in a passable position
    // Second turn is pass-only (no piece move)
    const steps = buildReplaySteps([
      {
        turnNumber: 1,
        player: 'white',
        pieceMove: { from: 'd1', to: 'c3' },
      },
      {
        turnNumber: 2,
        player: 'white',
        ballPasses: [{ from: 'c3', to: 'e1' }],
      },
    ]);

    // Turn 1: start + move = 2 steps so far
    // Turn 2: pass only = 1 step
    // Total: start + move + pass = 3
    expect(steps).toHaveLength(3);
    expect(steps[2].actionType).toBe('pass');
    expect(steps[2].description).toContain('c3');
    expect(steps[2].description).toContain('e1');
    expect(countBalls(steps[2].board, 'white')).toBe(1);
    expect(ballHolder(steps[2].board, 'white')).toBe('e1');
  });

  it('does not mutate boards between steps', () => {
    const steps = buildReplaySteps([
      {
        turnNumber: 1,
        player: 'white',
        pieceMove: { from: 'd1', to: 'c3' },
        ballPasses: [{ from: 'c3', to: 'e1' }],
      },
    ]);

    // Mutating step 1's board should not affect step 0 or step 2
    steps[1].board['a1'] = { color: 'white', hasBall: true, position: 'a1' };
    expect(steps[0].board['a1']).toBeNull();
    expect(steps[2].board['a1']).toBeNull();
  });
});
