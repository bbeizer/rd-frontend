# Backend Action API Implementation Spec

This document contains everything needed to implement the action-based game API endpoint for Razzle Dazzle.

## Overview

The frontend will send minimal **actions** (like `CELL_CLICK`) to the server. The server validates the action, applies game logic, and returns the authoritative game state.

---

## API Endpoint

### `POST /api/games/:gameId/action`

**Request Body:**
```typescript
{
  gameId: string;
  playerId: string;
  action:
    | { type: 'CELL_CLICK'; payload: { cellKey: string } }  // e.g., "e4"
    | { type: 'PASS_TURN' }
    | { type: 'SEND_MESSAGE'; payload: { author: string; text: string } }
}
```

**Response:**
```typescript
{
  success: boolean;
  gameState?: ServerGame;  // Full game state on success
  error?: {
    code: 'INVALID_ACTION' | 'NOT_YOUR_TURN' | 'GAME_OVER' | 'UNAUTHORIZED';
    message: string;
  };
}
```

---

## Data Types

### Piece
```typescript
type Piece = {
  color: 'white' | 'black';
  hasBall: boolean;
  position: string;  // Cell key like "e4"
};
```

### ServerGame (existing schema - extend as needed)
```typescript
type ServerGame = {
  _id: string;
  status: 'playing' | 'not started' | 'completed';
  gameType: 'singleplayer' | 'multiplayer';
  currentBoardStatus: Record<string, Piece | null>;  // 64 cells, "a1" to "h8"
  possibleMoves: string[];      // Valid move targets for active piece
  possiblePasses: string[];     // Valid pass targets for active piece
  winner: string | null;        // Player name who won
  activePiece: {
    position: string | null;
    color?: 'black' | 'white';
    hasBall: boolean;
  } | null;
  movedPiece: { position: string } | null;  // Piece that moved this turn
  hasMoved: boolean;            // Has a piece moved this turn?
  originalSquare: string | null; // Where movedPiece came from (for undo)
  currentPlayerTurn: 'white' | 'black';
  whitePlayerId?: string;
  blackPlayerId?: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
  aiColor: 'white' | 'black' | null;  // AI's color in singleplayer
  turnNumber: number;
  // ... other fields
};
```

---

## Board Coordinate System

- **Cell keys**: Chess notation `a1` to `h8`
- **Columns**: `a-h` (left to right) = indices 0-7
- **Rows**: `1-8` (bottom to top for white) = indices 7-0

### Conversion Functions
```typescript
// Cell key to array indices
function getKeyCoordinates(cellKey: string): { row: number; col: number } {
  const col = cellKey.charCodeAt(0) - 'a'.charCodeAt(0);  // 'a' -> 0, 'h' -> 7
  const row = 8 - parseInt(cellKey.slice(1), 10);          // '8' -> 0, '1' -> 7
  return { row, col };
}

// Array indices to cell key
function toCellKey(row: number, col: number): string {
  const letter = String.fromCharCode(97 + col);  // 0 -> 'a', 7 -> 'h'
  const number = 8 - row;                         // 0 -> 8, 7 -> 1
  return `${letter}${number}`;
}
```

---

## Initial Board Setup

```
Row 0 (rank 8): Black pieces at c8, d8, e8, f8 (e8 has ball)
Row 7 (rank 1): White pieces at c1, d1, e1, f1 (d1 has ball)
All other cells: null
```

```typescript
function initializeBoard(): Record<string, Piece | null> {
  const board: Record<string, Piece | null> = {};

  // Initialize all 64 cells to null
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cellKey = toCellKey(row, col);
      board[cellKey] = null;
    }
  }

  // Black pieces on row 8 (array row 0), columns c-f (indices 2-5)
  board['c8'] = { color: 'black', hasBall: false, position: 'c8' };
  board['d8'] = { color: 'black', hasBall: false, position: 'd8' };
  board['e8'] = { color: 'black', hasBall: true, position: 'e8' };   // Ball
  board['f8'] = { color: 'black', hasBall: false, position: 'f8' };

  // White pieces on row 1 (array row 7), columns c-f (indices 2-5)
  board['c1'] = { color: 'white', hasBall: false, position: 'c1' };
  board['d1'] = { color: 'white', hasBall: true, position: 'd1' };   // Ball
  board['e1'] = { color: 'white', hasBall: false, position: 'e1' };
  board['f1'] = { color: 'white', hasBall: false, position: 'f1' };

  return board;
}
```

---

## Game Rules

### Piece Movement (Knight-like)
- All pieces move in an **L-shape** like chess knights
- 8 possible move directions: (±1, ±2) and (±2, ±1)
- Can only move to **empty squares**
- **One piece** can move per turn
- After moving, that piece can only return to its original square (undo)

### Ball Passing
- Ball moves in **straight lines** (horizontal, vertical, diagonal)
- Ball can only be passed to a **same-color piece** that doesn't have the ball
- Ball stops at the **first piece** encountered in each direction
- **Unlimited passes** per turn
- A piece holding the ball **cannot move** (but can pass)

### Win Condition
- **White wins**: White piece with ball reaches row 8 (a8-h8)
- **Black wins**: Black piece with ball reaches row 1 (a1-h1)

### Turn Structure
1. Player can move ONE piece (optional)
2. Player can pass the ball unlimited times
3. Player clicks "Pass Turn" to end their turn
4. Turn switches to opponent

---

## Game Logic Functions to Implement

### 1. getPieceMoves - Calculate Valid Knight Moves

```typescript
function getPieceMoves(
  cellKey: string,
  board: Record<string, Piece | null>,
  hasMoved: boolean,
  originalSquare: string | null
): string[] {
  // If piece already moved this turn, can only return to original square
  if (hasMoved && originalSquare) {
    return [originalSquare];
  }

  const { row, col } = getKeyCoordinates(cellKey);
  const moves: string[] = [];

  // Knight move offsets (L-shape)
  const offsets = [
    { row: -2, col: 1 },  { row: -1, col: 2 },
    { row: 1, col: 2 },   { row: 2, col: 1 },
    { row: 2, col: -1 },  { row: 1, col: -2 },
    { row: -1, col: -2 }, { row: -2, col: -1 },
  ];

  for (const offset of offsets) {
    const newRow = row + offset.row;
    const newCol = col + offset.col;

    // Check bounds
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const targetKey = toCellKey(newRow, newCol);
      // Only empty squares are valid
      if (board[targetKey] === null) {
        moves.push(targetKey);
      }
    }
  }

  return moves;
}
```

### 2. getValidPasses - Calculate Valid Ball Pass Targets

```typescript
function getValidPasses(
  cellKey: string,
  pieceColor: 'white' | 'black',
  board: Record<string, Piece | null>
): string[] {
  const { row, col } = getKeyCoordinates(cellKey);
  const validPasses: string[] = [];

  // 8 directions: horizontal, vertical, diagonal
  const directions = [
    { dx: 1, dy: 0 },   { dx: -1, dy: 0 },   // Right, Left
    { dx: 0, dy: 1 },   { dx: 0, dy: -1 },   // Down, Up
    { dx: 1, dy: 1 },   { dx: 1, dy: -1 },   // Diagonals
    { dx: -1, dy: 1 },  { dx: -1, dy: -1 },
  ];

  for (const { dx, dy } of directions) {
    let currentRow = row + dy;
    let currentCol = col + dx;

    // Extend in this direction until hitting a piece or edge
    while (currentRow >= 0 && currentRow < 8 && currentCol >= 0 && currentCol < 8) {
      const targetKey = toCellKey(currentRow, currentCol);
      const targetPiece = board[targetKey];

      if (targetPiece) {
        // Found a piece - check if valid pass target
        if (targetPiece.color === pieceColor && !targetPiece.hasBall) {
          validPasses.push(targetKey);
        }
        break;  // Stop looking in this direction
      }

      currentRow += dy;
      currentCol += dx;
    }
  }

  return validPasses;
}
```

### 3. didWin - Check Win Condition

```typescript
function didWin(board: Record<string, Piece | null>): 'white' | 'black' | null {
  // Check if black won (black piece with ball on row 1)
  const row1 = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'];
  for (const cell of row1) {
    const piece = board[cell];
    if (piece && piece.color === 'black' && piece.hasBall) {
      return 'black';
    }
  }

  // Check if white won (white piece with ball on row 8)
  const row8 = ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];
  for (const cell of row8) {
    const piece = board[cell];
    if (piece && piece.color === 'white' && piece.hasBall) {
      return 'white';
    }
  }

  return null;
}
```

### 4. movePiece - Execute a Piece Move

```typescript
function movePiece(
  sourceKey: string,
  targetKey: string,
  board: Record<string, Piece | null>
): Record<string, Piece | null> {
  const newBoard = { ...board };
  const piece = newBoard[sourceKey];

  if (piece) {
    newBoard[targetKey] = { ...piece, position: targetKey };
    newBoard[sourceKey] = null;
  }

  return newBoard;
}
```

### 5. passBall - Execute a Ball Pass

```typescript
function passBall(
  sourceKey: string,
  targetKey: string,
  board: Record<string, Piece | null>
): Record<string, Piece | null> {
  const newBoard = { ...board };
  const sourcePiece = newBoard[sourceKey];
  const targetPiece = newBoard[targetKey];

  if (sourcePiece && targetPiece) {
    newBoard[sourceKey] = { ...sourcePiece, hasBall: false };
    newBoard[targetKey] = { ...targetPiece, hasBall: true };
  }

  return newBoard;
}
```

---

## Main Action Handler - State Machine

This is the core logic that processes `CELL_CLICK` actions:

```typescript
function handleCellClick(
  game: ServerGame,
  cellKey: string,
  playerId: string
): { success: boolean; game?: ServerGame; error?: string } {

  // 1. Validate it's this player's turn
  const playerColor = game.whitePlayerId === playerId ? 'white' :
                      game.blackPlayerId === playerId ? 'black' : null;

  if (!playerColor || game.currentPlayerTurn !== playerColor) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }

  if (game.status === 'completed') {
    return { success: false, error: 'GAME_OVER' };
  }

  // 2. Get what's at the clicked cell
  const clickedPiece = game.currentBoardStatus[cellKey];
  const activePiece = game.activePiece;

  // 3. CLICKED ON A PIECE
  if (clickedPiece) {
    // Can't click opponent's pieces
    if (clickedPiece.color !== playerColor) {
      return { success: false, error: 'INVALID_ACTION' };
    }

    // Restriction: if a piece has moved and active piece doesn't have ball,
    // can only interact with movedPiece or piece with ball
    if (game.movedPiece && !activePiece?.hasBall) {
      const isMovedPiece = clickedPiece.position === game.movedPiece.position;
      const hasBall = clickedPiece.hasBall;
      const isActivePiece = activePiece?.position === clickedPiece.position;

      if (!isMovedPiece && !hasBall && !isActivePiece) {
        return { success: false, error: 'INVALID_ACTION' };
      }
    }

    // PIECE HAS BALL - show pass options or deselect
    if (clickedPiece.hasBall) {
      if (activePiece?.position === cellKey) {
        // Clicking same piece = deselect
        return {
          success: true,
          game: clearSelection(game)
        };
      } else {
        // Select piece with ball, show pass targets
        const newGame = { ...game };
        newGame.activePiece = clickedPiece;
        newGame.possibleMoves = [];
        newGame.possiblePasses = getValidPasses(cellKey, clickedPiece.color, game.currentBoardStatus);
        return { success: true, game: newGame };
      }
    }

    // PIECE WITHOUT BALL
    else {
      // If active piece has ball and this piece can receive
      if (activePiece?.hasBall && game.possiblePasses.includes(cellKey)) {
        // Execute ball pass
        const newBoard = passBall(activePiece.position, cellKey, game.currentBoardStatus);
        const newGame = { ...game, currentBoardStatus: newBoard };

        // Update active piece to receiver
        newGame.activePiece = { ...clickedPiece, hasBall: true };
        newGame.possiblePasses = getValidPasses(cellKey, clickedPiece.color, newBoard);
        newGame.possibleMoves = [];

        // Check win condition
        const winner = didWin(newBoard);
        if (winner) {
          newGame.status = 'completed';
          newGame.winner = winner === 'white' ? game.whitePlayerName : game.blackPlayerName;
        }

        return { success: true, game: newGame };
      }

      // Otherwise, select this piece (show moves or deselect)
      if (activePiece?.position === cellKey) {
        // Deselect
        return { success: true, game: clearSelection(game) };
      } else {
        // Select and show moves
        const newGame = { ...game };

        // If this is the moved piece, can only return to original
        if (game.movedPiece?.position === cellKey) {
          newGame.activePiece = clickedPiece;
          newGame.possibleMoves = game.originalSquare ? [game.originalSquare] : [];
        } else {
          newGame.activePiece = clickedPiece;
          newGame.possibleMoves = getPieceMoves(
            cellKey,
            game.currentBoardStatus,
            game.hasMoved,
            game.originalSquare
          );
        }
        newGame.possiblePasses = [];
        return { success: true, game: newGame };
      }
    }
  }

  // 4. CLICKED ON EMPTY CELL
  else {
    if (!activePiece) {
      // Nothing selected, clicking empty = no-op
      return { success: true, game: clearSelection(game) };
    }

    // Active piece has ball - can't move, deselect
    if (activePiece.hasBall) {
      return { success: true, game: clearSelection(game) };
    }

    // Check if this is a valid move
    if (game.possibleMoves.includes(cellKey)) {
      // CASE: No piece has moved yet - execute move
      if (!game.movedPiece) {
        const newBoard = movePiece(activePiece.position, cellKey, game.currentBoardStatus);
        const movedPiece = newBoard[cellKey]!;

        const newGame = {
          ...game,
          currentBoardStatus: newBoard,
          activePiece: movedPiece,
          movedPiece: { position: cellKey },
          originalSquare: activePiece.position,
          hasMoved: true,
          possibleMoves: [activePiece.position],  // Can only return
          possiblePasses: [],
        };

        return { success: true, game: newGame };
      }

      // CASE: Returning to original square (undo move)
      if (cellKey === game.originalSquare) {
        const newBoard = movePiece(activePiece.position, cellKey, game.currentBoardStatus);

        const newGame = {
          ...game,
          currentBoardStatus: newBoard,
          activePiece: null,
          movedPiece: null,
          originalSquare: null,
          hasMoved: false,
          possibleMoves: [],
          possiblePasses: [],
        };

        return { success: true, game: newGame };
      }
    }

    // Invalid move - if piece already moved, show "return to original" hint
    if (game.movedPiece) {
      const newGame = { ...game };
      newGame.activePiece = game.currentBoardStatus[game.movedPiece.position];
      newGame.possibleMoves = game.originalSquare ? [game.originalSquare] : [];
      return { success: true, game: newGame };
    }

    // Otherwise just deselect
    return { success: true, game: clearSelection(game) };
  }
}

function clearSelection(game: ServerGame): ServerGame {
  return {
    ...game,
    activePiece: null,
    possibleMoves: [],
    possiblePasses: [],
  };
}
```

---

## PASS_TURN Handler

```typescript
function handlePassTurn(
  game: ServerGame,
  playerId: string
): { success: boolean; game?: ServerGame; error?: string } {

  const playerColor = game.whitePlayerId === playerId ? 'white' :
                      game.blackPlayerId === playerId ? 'black' : null;

  if (!playerColor || game.currentPlayerTurn !== playerColor) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }

  if (game.status === 'completed') {
    return { success: false, error: 'GAME_OVER' };
  }

  // Switch turn
  const nextTurn = playerColor === 'white' ? 'black' : 'white';

  let newGame: ServerGame = {
    ...game,
    currentPlayerTurn: nextTurn,
    activePiece: null,
    movedPiece: null,
    originalSquare: null,
    hasMoved: false,
    possibleMoves: [],
    possiblePasses: [],
    turnNumber: game.turnNumber + 1,
  };

  // SINGLEPLAYER: If it's now AI's turn, make AI move
  if (game.gameType === 'singleplayer' && nextTurn === game.aiColor) {
    newGame = makeAIMove(newGame);
    // After AI moves, switch back to player
    newGame.currentPlayerTurn = playerColor;
  }

  return { success: true, game: newGame };
}
```

---

## Singleplayer AI Integration

When `PASS_TURN` is processed and it becomes the AI's turn:

1. Call your AI service with the current game state
2. AI returns the updated board state after its move
3. Apply AI's move to the game
4. Switch turn back to the human player
5. Return the final state (with AI's move already applied)

```typescript
async function makeAIMove(game: ServerGame): Promise<ServerGame> {
  // Call AI service
  const aiResponse = await fetch(AI_SERVICE_URL, {
    method: 'POST',
    body: JSON.stringify({ game, color: game.aiColor }),
  });

  const aiResult = await aiResponse.json();

  // Merge AI's board state
  const newGame = {
    ...game,
    currentBoardStatus: aiResult.currentBoardStatus,
    // Reset turn state
    activePiece: null,
    movedPiece: null,
    originalSquare: null,
    hasMoved: false,
    possibleMoves: [],
    possiblePasses: [],
  };

  // Check if AI won
  const winner = didWin(newGame.currentBoardStatus);
  if (winner) {
    newGame.status = 'completed';
    newGame.winner = winner === 'white' ? game.whitePlayerName : game.blackPlayerName;
  }

  return newGame;
}
```

---

## Socket.IO Broadcasting

After processing any action, broadcast the updated game state to all players:

```typescript
io.to(gameId).emit('gameUpdated', updatedGame);
```

---

## Error Handling Summary

| Error Code | When to Return |
|------------|----------------|
| `NOT_YOUR_TURN` | Player tries to act when it's not their turn |
| `INVALID_ACTION` | Click on opponent piece, invalid move, etc. |
| `GAME_OVER` | Game is already completed |
| `UNAUTHORIZED` | Player ID doesn't match either player |

---

## Testing Checklist

- [ ] Can select a piece (shows valid moves)
- [ ] Can move a piece to valid square
- [ ] Can undo move (return to original square)
- [ ] Cannot move piece that has ball
- [ ] Can pass ball to same-color piece
- [ ] Ball stops at first piece in direction
- [ ] Cannot pass to opponent or piece with ball
- [ ] Win detection works (both colors)
- [ ] Turn switching works
- [ ] Singleplayer AI moves execute correctly
- [ ] Multiplayer Socket.IO sync works
- [ ] Invalid actions return proper errors
