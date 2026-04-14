import { Piece } from '@/types/Piece';
import { v4 as uuidv4 } from 'uuid';

export const generateGuestUserID = () => {
  const guestId = uuidv4(); // Generate a unique ID
  localStorage.setItem('guestUserID', guestId); // Store it in local storage
  return guestId;
};

const initialSetup = (
  rowIndex: number,
  colIndex: number
): {
  pieceColor: 'white' | 'black' | null;
  hasBall: boolean;
  id: string | null;
} => {
  let pieceColor: 'white' | 'black' | null = null;
  let hasBall = false;
  let id: string | null = null;

  if (rowIndex === 0 && [2, 3, 4, 5].includes(colIndex)) {
    pieceColor = 'black';
    hasBall = colIndex === 4;
    id = uuidv4();
  } else if (rowIndex === 7 && [2, 3, 4, 5].includes(colIndex)) {
    pieceColor = 'white';
    hasBall = colIndex === 3;
    id = uuidv4();
  }

  return { pieceColor, hasBall, id };
};

export const initializeGameBoard = (): Record<string, Piece | null> => {
  const board: Record<string, Piece | null> = {};
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cellKey = `${String.fromCharCode(97 + col)}${8 - row}`;
      const { pieceColor, hasBall } = initialSetup(row, col);

      if (pieceColor) {
        board[cellKey] = {
          color: pieceColor,
          hasBall,
          position: cellKey,
        };
      } else {
        board[cellKey] = null;
      }
    }
  }
  return board;
};

/**
 * Convert a backend board snapshot into our frontend Piece record format.
 * Returns a deep copy so the caller can mutate freely.
 */
const snapshotToBoard = (
  snapshot: Record<string, { color: string; hasBall: boolean; position: string } | null>
): Record<string, Piece | null> => {
  const board: Record<string, Piece | null> = {};
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cellKey = `${String.fromCharCode(97 + col)}${8 - row}`;
      const cell = snapshot[cellKey];
      board[cellKey] = cell
        ? { color: cell.color as 'white' | 'black', hasBall: cell.hasBall, position: cell.position }
        : null;
    }
  }
  return board;
};

/**
 * Deep-clone a board so mutations don't leak between replay steps.
 */
const cloneBoard = (board: Record<string, Piece | null>): Record<string, Piece | null> => {
  const copy: Record<string, Piece | null> = {};
  for (const key in board) {
    const p = board[key];
    copy[key] = p ? { ...p } : null;
  }
  return copy;
};

/**
 * Apply a single ball pass to a board (mutates in place).
 * Clears hasBall on the sender before setting it on the receiver,
 * preventing duplicate-ball states.
 */
const applyBallPass = (board: Record<string, Piece | null>, from: string, to: string): void => {
  const fromPiece = board[from];
  const toPiece = board[to];
  if (fromPiece) board[from] = { ...fromPiece, hasBall: false };
  if (toPiece) board[to] = { ...toPiece, hasBall: true };
};

/**
 * Dev-only invariant check: exactly one ball holder per color.
 * Logs a warning in development; no-op in production.
 */
export const assertBallInvariant = (board: Record<string, Piece | null>, context: string): void => {
  if (process.env.NODE_ENV === 'production') return;

  const ballCounts = { white: 0, black: 0 };
  for (const key in board) {
    const p = board[key];
    if (p?.hasBall) ballCounts[p.color]++;
  }
  if (ballCounts.white !== 1 || ballCounts.black !== 1) {
    console.warn(
      `[ReplayInvariant] ${context}: ball counts white=${ballCounts.white} black=${ballCounts.black}`
    );
  }
};

type MoveEntry = {
  pieceMove?: { from: string; to: string };
  ballPasses?: Array<{ from: string; to: string }>;
  actionStates?: Array<{
    action: string;
    boardSnapshot: Record<string, { color: string; hasBall: boolean; position: string } | null>;
  }>;
  boardSnapshot?: Record<string, { color: string; hasBall: boolean; position: string } | null>;
};

export const reconstructBoardAtTurn = (
  moveHistory: MoveEntry[],
  targetTurn: number
): Record<string, Piece | null> => {
  // Find the latest snapshot at or before targetTurn to avoid replaying from scratch.
  let board: Record<string, Piece | null> | null = null;
  let startFrom = 0;

  for (let i = Math.min(targetTurn, moveHistory.length) - 1; i >= 0; i--) {
    const move = moveHistory[i];
    if (move.boardSnapshot) {
      board = snapshotToBoard(move.boardSnapshot);
      startFrom = i + 1; // This snapshot represents state *after* turn i
      break;
    }
  }

  if (!board) {
    board = initializeGameBoard();
    startFrom = 0;
  }

  // Replay remaining turns via delta application
  for (let i = startFrom; i < targetTurn && i < moveHistory.length; i++) {
    const move = moveHistory[i];
    board = cloneBoard(board);

    // Apply piece move
    if (move.pieceMove) {
      const piece = board[move.pieceMove.from];
      if (piece) {
        board[move.pieceMove.to] = { ...piece, position: move.pieceMove.to };
        board[move.pieceMove.from] = null;
      }
    }

    const passes = move.ballPasses ?? [];
    for (const pass of passes) {
      applyBallPass(board, pass.from, pass.to);
    }

    assertBallInvariant(board, `after turn ${i + 1}`);
  }

  return board;
};

export type HighlightMap = Record<string, 'red' | 'yellow' | 'blue'>;

export interface ReplayStep {
  turnIndex: number;
  turnNumber: number;
  player: 'white' | 'black';
  actionIndex: number;
  actionType: 'move' | 'pass' | 'start';
  description: string;
  board: Record<string, Piece | null>;
  highlights: HighlightMap;
}

export const buildReplaySteps = (
  moveHistory: Array<MoveEntry & { turnNumber: number; player: 'white' | 'black' }>
): ReplayStep[] => {
  const steps: ReplayStep[] = [];
  let board = initializeGameBoard();

  // Step 0: initial position
  steps.push({
    turnIndex: -1,
    turnNumber: 0,
    player: 'white',
    actionIndex: 0,
    actionType: 'start',
    description: 'Starting position',
    board: cloneBoard(board),
    highlights: {},
  });

  for (let i = 0; i < moveHistory.length; i++) {
    const move = moveHistory[i];
    let actionIndex = 0;

    // If the turn has a boardSnapshot AND no sub-actions to step through,
    // just use the snapshot as a single step.
    const passes = move.ballPasses ?? [];
    const hasSubActions = !!move.pieceMove || passes.length > 0;

    if (!hasSubActions) {
      // Pass turn — board unchanged, single step
      steps.push({
        turnIndex: i,
        turnNumber: move.turnNumber,
        player: move.player,
        actionIndex: 0,
        actionType: 'move',
        description: 'pass turn',
        board: cloneBoard(board),
        highlights: {},
      });
      continue;
    }

    // Apply piece move as its own step
    if (move.pieceMove) {
      board = cloneBoard(board);
      const piece = board[move.pieceMove.from];
      if (piece) {
        board[move.pieceMove.to] = { ...piece, position: move.pieceMove.to };
        board[move.pieceMove.from] = null;
      }

      steps.push({
        turnIndex: i,
        turnNumber: move.turnNumber,
        player: move.player,
        actionIndex: actionIndex++,
        actionType: 'move',
        description: `${move.pieceMove.from} \u2192 ${move.pieceMove.to}`,
        board: cloneBoard(board),
        highlights: {
          [move.pieceMove.from]: 'blue',
          [move.pieceMove.to]: 'red',
        },
      });
    }

    // Apply each pass as its own step
    for (const pass of passes) {
      board = cloneBoard(board);
      applyBallPass(board, pass.from, pass.to);

      steps.push({
        turnIndex: i,
        turnNumber: move.turnNumber,
        player: move.player,
        actionIndex: actionIndex++,
        actionType: 'pass',
        description: `pass ${pass.from} \u2192 ${pass.to}`,
        board: cloneBoard(board),
        highlights: {
          [pass.from]: 'yellow',
          [pass.to]: 'yellow',
        },
      });
    }

    // If we have a boardSnapshot, use it as the authoritative final state
    // to correct any drift from delta application
    if (move.boardSnapshot) {
      board = snapshotToBoard(move.boardSnapshot);
    }

    assertBallInvariant(board, `after turn ${i + 1}`);
  }

  return steps;
};

export const getKeyCoordinates = (cellKey: string) => {
  const col = cellKey.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(cellKey.slice(1), 10);
  return { row, col };
};

export const toCellKey = (row: number, col: number) => {
  const letter = String.fromCharCode(97 + col);
  const number = 8 - row;
  return `${letter}${number}`;
};
