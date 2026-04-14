import { reconstructBoardAtTurn, initializeGameBoard, assertBallInvariant } from '../gameUtilities';
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

describe('reconstructBoardAtTurn', () => {
  describe('initial board (turn 0)', () => {
    it('returns starting position with exactly one ball per color', () => {
      const board = reconstructBoardAtTurn([], 0);
      expect(countBalls(board, 'white')).toBe(1);
      expect(countBalls(board, 'black')).toBe(1);
      expect(ballHolder(board, 'white')).toBe('d1');
      expect(ballHolder(board, 'black')).toBe('e8');
    });
  });

  describe('single pass turn', () => {
    it('moves the ball correctly', () => {
      const history = [
        {
          pieceMove: { from: 'd1', to: 'c3' },
          ballPasses: [{ from: 'c3', to: 'e1' }],
        },
      ];
      const board = reconstructBoardAtTurn(history, 1);

      expect(countBalls(board, 'white')).toBe(1);
      expect(countBalls(board, 'black')).toBe(1);
      expect(ballHolder(board, 'white')).toBe('e1');
      expect(board['c3']?.hasBall).toBe(false);
    });
  });

  describe('multi-pass chain turn', () => {
    it('applies all passes in a chain without creating duplicate balls', () => {
      const history = [
        {
          pieceMove: { from: 'd1', to: 'c3' },
          ballPasses: [
            { from: 'c3', to: 'e1' },
            { from: 'e1', to: 'f1' },
          ],
        },
      ];
      const board = reconstructBoardAtTurn(history, 1);

      expect(countBalls(board, 'white')).toBe(1);
      expect(countBalls(board, 'black')).toBe(1);
      expect(ballHolder(board, 'white')).toBe('f1');
      expect(board['c3']?.hasBall).toBe(false);
      expect(board['e1']?.hasBall).toBe(false);
    });
  });

  describe('move + multi-pass across multiple turns', () => {
    it('maintains ball invariant across multiple turns', () => {
      const history = [
        {
          pieceMove: { from: 'd1', to: 'c3' },
          ballPasses: [{ from: 'c3', to: 'e1' }],
        },
        {
          pieceMove: { from: 'e8', to: 'd6' },
          ballPasses: [{ from: 'd6', to: 'f8' }],
        },
      ];

      for (let turn = 0; turn <= 2; turn++) {
        const board = reconstructBoardAtTurn(history, turn);
        expect(countBalls(board, 'white')).toBe(1);
        expect(countBalls(board, 'black')).toBe(1);
      }

      const finalBoard = reconstructBoardAtTurn(history, 2);
      expect(ballHolder(finalBoard, 'white')).toBe('e1');
      expect(ballHolder(finalBoard, 'black')).toBe('f8');
    });
  });

  describe('no-action turn (pass turn)', () => {
    it('board remains unchanged', () => {
      const history = [{}];
      const boardBefore = initializeGameBoard();
      const boardAfter = reconstructBoardAtTurn(history, 1);

      for (const key of Object.keys(boardBefore)) {
        expect(boardAfter[key]).toEqual(boardBefore[key]);
      }
    });
  });

  describe('boardSnapshot support', () => {
    it('uses boardSnapshot when available instead of delta reconstruction', () => {
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
      snapshotBoard['a4'] = { color: 'white', hasBall: true, position: 'a4' };
      snapshotBoard['e5'] = { color: 'black', hasBall: true, position: 'e5' };

      const history = [
        {
          pieceMove: { from: 'd1', to: 'c3' },
          boardSnapshot: snapshotBoard,
        },
      ];

      const board = reconstructBoardAtTurn(history, 1);
      expect(ballHolder(board, 'white')).toBe('a4');
      expect(ballHolder(board, 'black')).toBe('e5');
      expect(countBalls(board, 'white')).toBe(1);
      expect(countBalls(board, 'black')).toBe(1);
    });

    it('uses latest snapshot and replays remaining turns via delta', () => {
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
      snapshotBoard['c3'] = { color: 'white', hasBall: true, position: 'c3' };
      snapshotBoard['e1'] = { color: 'white', hasBall: false, position: 'e1' };
      snapshotBoard['d6'] = { color: 'black', hasBall: true, position: 'd6' };

      const history = [
        {
          pieceMove: { from: 'd1', to: 'c3' },
          boardSnapshot: snapshotBoard,
        },
        {
          ballPasses: [{ from: 'c3', to: 'e1' }],
        },
      ];

      const board = reconstructBoardAtTurn(history, 2);
      expect(ballHolder(board, 'white')).toBe('e1');
      expect(board['c3']?.hasBall).toBe(false);
    });
  });

  describe('move without pass', () => {
    it('handles entries with only pieceMove', () => {
      const history = [{ pieceMove: { from: 'c1', to: 'b3' } }];
      const board = reconstructBoardAtTurn(history, 1);
      expect(countBalls(board, 'white')).toBe(1);
      expect(countBalls(board, 'black')).toBe(1);
      expect(ballHolder(board, 'white')).toBe('d1');
    });
  });

  describe('deep clone isolation', () => {
    it('does not mutate boards between calls', () => {
      const history = [
        {
          pieceMove: { from: 'd1', to: 'c3' },
          ballPasses: [{ from: 'c3', to: 'e1' }],
        },
      ];

      const board0 = reconstructBoardAtTurn(history, 0);
      const board1 = reconstructBoardAtTurn(history, 1);

      // Turn 0 should still show ball on d1
      expect(ballHolder(board0, 'white')).toBe('d1');
      // Turn 1 should show ball on e1
      expect(ballHolder(board1, 'white')).toBe('e1');
    });
  });

  describe('invariant assertion', () => {
    it('assertBallInvariant detects multiple ball holders', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const board: Record<string, Piece | null> = {
        a1: { color: 'white', hasBall: true, position: 'a1' },
        b1: { color: 'white', hasBall: true, position: 'b1' },
        c8: { color: 'black', hasBall: true, position: 'c8' },
      };

      assertBallInvariant(board, 'test');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('white=2'));

      warnSpy.mockRestore();
    });

    it('assertBallInvariant does not warn for valid board', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const board = initializeGameBoard();
      assertBallInvariant(board, 'test');
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
