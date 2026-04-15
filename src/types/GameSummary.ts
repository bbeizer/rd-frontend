export interface BoardSnapshot {
  [cellKey: string]: {
    color: 'white' | 'black';
    hasBall: boolean;
    position: string;
  } | null;
}

export interface ActionState {
  actionType: 'pieceMove' | 'ballPass';
  pieceMove?: { from: string; to: string };
  ballPass?: { from: string; to: string };
  boardSnapshot: BoardSnapshot;
}

export interface MoveHistoryEntry {
  turnNumber: number;
  player: 'white' | 'black';
  pieceMove?: { from: string; to: string };
  ballPasses?: Array<{ from: string; to: string }>;
  /** Per-action snapshots (new games) */
  actionStates?: ActionState[];
  /** Turn-final board snapshot (new games) */
  boardSnapshot?: BoardSnapshot;
}

export interface GameSummary {
  _id: string;
  status?: 'pending' | 'playing' | 'completed';
  whitePlayerName: string;
  blackPlayerName: string;
  winner: string;
  gameType: 'singleplayer' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  aiColor: 'white' | 'black' | null;
  moveHistory: MoveHistoryEntry[];
  turnNumber?: number;
  turnCount?: number;
  createdAt: string;
}
