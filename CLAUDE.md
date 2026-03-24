# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server

# Build
npm run build        # Type check + production build

# Type Checking & Linting
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run format       # Run Prettier

# Testing
npm test             # Run all Jest tests
npm test -- --watch  # Watch mode
npm test -- path/to/file.test.ts  # Run single test file
```

## Architecture

This is **Razzle Dazzle** - a React/TypeScript board game frontend where players move knight-like pieces and pass a ball to reach the opponent's back rank.

### Tech Stack
- React 18 + TypeScript + Vite
- Socket.IO for real-time multiplayer
- Axios for REST API calls
- Jest + React Testing Library for tests

### Key Patterns

**State Management**: Game state flows through two custom hooks:
- `useGameState` (`src/hooks/useGameState.ts`) - Fetches game from server, provides `updateGameOnServer`
- `useGameActions` (`src/hooks/useGameActions.ts`) - Handles cell clicks, pass turn, chat messages. Uses `updateGameState` helper for move logic

**Game State Updates**: The core game logic lives in `src/components/GameBoard/helpers/updateGameState.ts`. This function is a state machine that handles:
- Piece selection/deselection
- Move validation and execution
- Ball passing between pieces
- Win detection

**API Layer**:
- `src/services/apiClient.ts` - Axios instance configured with `VITE_API_BASE_URL`
- `src/services/gameService.ts` - Game CRUD operations

**Real-time Updates**: `useGameSocket` hook connects to Socket.IO for multiplayer game state sync.

### Environment Variables
- `VITE_API_BASE_URL` - Backend API URL (default: `http://localhost:5050`)

### Path Alias
`@/*` maps to `src/*` (configured in both `tsconfig.json` and `vite.config.js`)

### Game Logic Location
Helper functions for game mechanics are in `src/components/GameBoard/helpers/`:
- `getPieceMoves.ts` - Calculate valid knight moves
- `getValidPasses.ts` - Calculate valid ball passes
- `didWin.ts` - Win condition check
- `movePiece.ts`, `passBall.ts` - Execute moves

### Routes
- `/` - Lobby (name entry, mode selection)
- `/game/:gameId` - Game board
