import type { GameState } from "@/types/GameState";
import '@testing-library/jest-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { updateGameState } from '../helpers/updateGameState';

// Create a simple mock game state for testing
const initialGameState = (): GameState => {
  const board: Record<string, any> = {};

  const files = 'abcdefgh';
  for (const file of files) {
    for (let rank = 1; rank <= 8; rank++) {
      const key = `${file}${rank}`;
      board[key] = null;
    }
  }

  // Add your starting pieces
  board['e1'] = { color: 'white', hasBall: false, position: 'e1' };
  board['f1'] = { color: 'white', hasBall: false, position: 'f1' };
  board['d1'] = { color: 'white', hasBall: true, position: 'd1' };
  board['c8'] = { color: 'black', hasBall: false, position: 'c8' };
  board['d8'] = { color: 'black', hasBall: false, position: 'd8' };
  board['e8'] = { color: 'black', hasBall: true, position: 'e8' };
  board['f8'] = { color: 'black', hasBall: false, position: 'f8' };

  return {
    gameId: 'test-game-id',
    gameType: 'singleplayer',
    currentPlayerTurn: 'white',
    activePiece: null,
    possibleMoves: [],
    hasMoved: false,
    movedPiece: null,
    movedPieceOriginalPosition: null,
    possiblePasses: [],
    playerColor: 'white',
    originalSquare: null,
    winner: null,
    whitePlayerName: 'TestWhite',
    blackPlayerName: 'TestBlack',
    isUserTurn: true,
    currentBoardStatus: board,
  };
};

jest.mock('../../../../ev', () => ({
  getEnv: () => ({ baseUrl: 'http://mockurl.com' }),
}));

describe('updateGameState', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = initialGameState();
    // Set up localStorage for tests
    localStorage.setItem('userColor', 'white');
  });

  it('should select a piece when clicked', () => {
    const cellKeyClicked = 'e1'; // Adjusted to rank 1
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.activePiece).toEqual({
      ...initialState.currentBoardStatus![cellKeyClicked],
      position: 'e1',
    });

    const expectedMoves = ['f3', 'g2', 'c2', 'd3'];
    expectedMoves.forEach((move) => {
      expect(newState.possibleMoves).toContain(move);
    });
  });

  it('should deselect a piece when the same piece is clicked again', () => {
    const cellKeyClicked = 'e1';
    initialState.activePiece = initialState.currentBoardStatus!['e1'];
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.activePiece).toBeNull();
    expect(newState.possibleMoves).toEqual([]);
  });

  it('should do nothing if an empty cell is clicked without an active piece', () => {
    const cellKeyClicked = 'b2';
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.activePiece).toBeNull();
    expect(newState.possibleMoves).toEqual([]);
  });

  it('active piece should move to cellKeyClicked if it is a possibleMove', () => {
    const cellKeyClicked = 'f3';
    expect(initialState.currentBoardStatus!['f3']).toBeNull();

    initialState.activePiece = initialState.currentBoardStatus!['e1'];
    initialState.possibleMoves = ['f3', 'g2', 'c2', 'd3'];

    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.currentBoardStatus?.['f3']).not.toBeNull();
    expect(newState.currentBoardStatus?.['e1']).toBeNull();
  });

  it('active piece should not move to cellKeyClicked if it is not a possibleMove', () => {
    const wrongDestinationKey = 'a1';
    initialState.activePiece = initialState.currentBoardStatus!['e1'];

    const newState = updateGameState(wrongDestinationKey, initialState);
    expect(newState.currentBoardStatus?.['e1']).toEqual({
      ...initialState.currentBoardStatus!['e1'],
      position: 'e1',
    });
    expect(newState.currentBoardStatus?.['a1']).toBeNull();
  });

  it('should update the possible moves when a piece is selected', () => {
    const cellKeyClicked = 'e1'; // Adjusted to rank 1
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.activePiece).toEqual({
      ...initialState.currentBoardStatus![cellKeyClicked],
      position: 'e1',
    });
    const expectedMoves = ['f3', 'g2', 'c2', 'd3'];
    expectedMoves.forEach((move) => {
      expect(newState.possibleMoves).toContain(move);
    });
  });

  it('should update the possible passes when a piece with a ball is selected', () => {
    const cellKeyClicked = 'd1'; // Adjusted to rank 1
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.activePiece).toEqual({
      ...initialState.currentBoardStatus![cellKeyClicked],
      position: 'd1',
      hasBall: true,
    });
    // Only 'e1' is a valid pass in this board setup
    expect(newState.possiblePasses).toContain('e1');
    // Do not expect 'c1' since it's not present
  });

  it('should clear possible moves when deselecting a piece', () => {
    const cellKeyClicked = 'e1'; // Adjusted to rank 1
    initialState.activePiece = {
      ...initialState.currentBoardStatus![cellKeyClicked],
      position: cellKeyClicked,
    };
    initialState.possibleMoves = ['f3', 'g4']; // Possible moves before deselecting

    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.possibleMoves).toEqual([]);
  });

  it('player should not be able to change state when it is not their turn', () => {
    const cellKeyClicked = 'e1'; // Adjusted to rank 1
    initialState.currentPlayerTurn = 'black'; // Set to black so it's not white's turn
    const newState = updateGameState(cellKeyClicked, initialState);
    // Only check that activePiece and possibleMoves are unchanged
    expect(newState.activePiece).toEqual(initialState.activePiece);
    expect(newState.possibleMoves).toEqual(initialState.possibleMoves);
  });

  it('piece should only be able to movback to its original sqaure after it has moves', () => {
    const firstPieceLocation = 'e1';
    const movedSquare = 'f3';
    const stateAfterPieceSelection = updateGameState(firstPieceLocation, initialState);
    const stateWhenPieceIsMoved = updateGameState(movedSquare, stateAfterPieceSelection);
    expect(stateWhenPieceIsMoved.possibleMoves).toContain(firstPieceLocation);
  });

  it('user should not be able to select another piece without the ball if theyve already moved a piece', () => {
    const firstMove = 'f3';
    expect(initialState.currentBoardStatus![firstMove]).toBeNull(); // f3 is empty before move
    initialState.activePiece = initialState.currentBoardStatus!['e1'];
    initialState.possibleMoves = [firstMove, 'g2', 'c2', 'd3'];
    let newState = updateGameState(firstMove, initialState);

    expect(newState.currentBoardStatus?.[firstMove]).not.toBeNull();
    expect(newState.currentBoardStatus?.['e1']).toBeNull();
    expect(newState.activePiece.position).toEqual(firstMove); // f3 piece is now active

    const secondMoveAttempt = 'f1';
    newState = updateGameState(secondMoveAttempt, newState);
    expect(newState.activePiece.position).toEqual(firstMove); // The active piece is still the one at f3
    expect(newState.activePiece.position).not.toEqual('f1');
  });
});
