import { initialGameState } from '../initialGameState';
import '@testing-library/jest-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { updateGameState } from '../helpers/updateGameState';

jest.mock('../../../../ev', () => ({
  getEnv: () => ({ baseUrl: 'http://mockurl.com' })
}));

describe('updateGameState', () => {
  let initialState;

  beforeEach(() => {
    // Initializes the game model to start each test with a clean slate
    initialState = initialGameState();
  });

  it('should select a piece when clicked', () => {
    const cellKeyClicked = 'e1'; // Adjusted to rank 1
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.activePiece).toEqual({ ...initialState.gameData.currentBoardStatus[cellKeyClicked], position: 'e1' });
    
    const expectedMoves = ['f3', 'g2', 'c2', 'd3'];
    expectedMoves.forEach(move => {
      expect(newState.possibleMoves).toContain(move);
    });
  });

  it('should deselect a piece when the same piece is clicked again', () => {
    const cellKeyClicked = 'e1';
    initialState.activePiece = initialState.gameData.currentBoardStatus['e1'];
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
    expect(initialState.gameData.currentBoardStatus['f3']).toBeNull();
    
    initialState.activePiece = initialState.gameData.currentBoardStatus['e1'];
    initialState.possibleMoves = ['f3', 'g2', 'c2', 'd3']; 
    
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.gameData.currentBoardStatus['f3']).not.toBeNull();
    expect(newState.gameData.currentBoardStatus['e1']).toBeNull();
  });

  it('active piece should not move to cellKeyClicked if it is not a possibleMove', () => {
    const wrongDestinationKey = 'a1';
    initialState.activePiece = initialState.gameData.currentBoardStatus['e1'];
    
    const newState = updateGameState(wrongDestinationKey, initialState);
    expect(newState.gameData.currentBoardStatus['e1']).toEqual({
      ...initialState.gameData.currentBoardStatus['e1'],
      position: 'e1'
    });
    expect(newState.gameData.currentBoardStatus['a1']).toBeNull();
  });

  it('should update the possible moves when a piece is selected', () => {
    const cellKeyClicked = 'e1'; // Adjusted to rank 1
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.activePiece).toEqual({ ...initialState.gameData.currentBoardStatus[cellKeyClicked], position: 'e1' });
    const expectedMoves = ['f3', 'g2', 'c2', 'd3'];
    expectedMoves.forEach(move => {
      expect(newState.possibleMoves).toContain(move);
    });
  });

  it('should update the possible passes when a piece with a ball is selected', () => {
    const cellKeyClicked = 'd1'; // Adjusted to rank 1
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.activePiece).toEqual({ ...initialState.gameData.currentBoardStatus[cellKeyClicked], position: 'd1', hasBall: true });
    const expectedPasses = ['e1', 'c1'];
    expectedPasses.forEach(pass => {
      expect(newState.possiblePasses).toContain(pass);
    });
  });

  it('should clear possible moves when deselecting a piece', () => {
    const cellKeyClicked = 'e1'; // Adjusted to rank 1
    initialState.activePiece = {
      ...initialState.gameData.currentBoardStatus[cellKeyClicked],
      position: cellKeyClicked
    };
    initialState.possibleMoves = ["f3", "g4"]; // Possible moves before deselecting
    
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState.possibleMoves).toEqual([]);
  });

  it('player should not be able to change state when it is not their turn', () => {
    const cellKeyClicked = 'e1'; // Adjusted to rank 1
    initialState.isUserTurn = false;
    const newState = updateGameState(cellKeyClicked, initialState);
    expect(newState).toEqual(initialState);
  });

  it('piece should only be ablke to movback to its original sqaure after it has moves', () => {
    const firstPieceLocation = 'e1';
    const movedSquare = 'f3';
    const stateAfterPieceSelection = updateGameState(firstPieceLocation, initialState);
    const stateWhenPieceIsMoved = updateGameState(movedSquare, stateAfterPieceSelection)
      expect(stateWhenPieceIsMoved.possibleMoves).toContain(firstPieceLocation)
    });

  it('user should not be able to select another piece without the ball if theyve already moved a piece', () => {
    const firstMove = 'f3';
    expect(initialState.gameData.currentBoardStatus[firstMove]).toBeNull(); // f3 is empty before move
    initialState.activePiece = initialState.gameData.currentBoardStatus['e1'];
    initialState.possibleMoves = [firstMove, 'g2', 'c2', 'd3'];
    let newState = updateGameState(firstMove, initialState);

    expect(newState.gameData.currentBoardStatus[firstMove]).not.toBeNull();
    expect(newState.gameData.currentBoardStatus['e1']).toBeNull();
    expect(newState.activePiece.position).toEqual(firstMove); // f3 piece is now active

    const secondMoveAttempt = 'f1';
    newState = updateGameState(secondMoveAttempt, newState);
    expect(newState.activePiece.position).toEqual(firstMove); // The active piece is still the one at f3
    expect(newState.activePiece.position).not.toEqual('f1');
});



});
