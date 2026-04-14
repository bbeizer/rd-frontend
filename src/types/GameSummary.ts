export interface MoveHistoryEntry {
  turnNumber: number;
  player: 'white' | 'black';
  pieceMove?: { from: string; to: string };
  ballPass?: { from: string; to: string };
}

export interface GameSummary {
  _id: string;
  whitePlayerName: string;
  blackPlayerName: string;
  winner: string;
  gameType: 'singleplayer' | 'multiplayer';
  difficulty?: 'easy' | 'medium' | 'hard';
  aiColor: 'white' | 'black' | null;
  moveHistory: MoveHistoryEntry[];
  createdAt: string;
}
