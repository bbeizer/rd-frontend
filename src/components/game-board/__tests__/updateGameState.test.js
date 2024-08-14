import { handleClick } from '../updateGameState';

describe('handleClick', () => {
  it('returns an object with the following keys: activePiece, possiblePasses, possibleMoves, gameBoard, movedPiece, originalSquare', () => {
    const result = handleClick();
    expect(result).toHaveProperty('activePiece');
    expect(result).toHaveProperty('possiblePasses');
    expect(result).toHaveProperty('possibleMoves');
    expect(result).toHaveProperty('gameBoard');
    expect(result).toHaveProperty('movedPiece');
    expect(result).toHaveProperty('originalSquare');
  });

  it('click on non-piece with no active piece', () => {
    const cellKeyClicked = 'd5'
    const gameStatus = {
      'activePiece': null,
      'a1': { piece: 'rook', color: 'white' },
      'b1': null,
      'c1': null,
      'd1': null,
      'e1': null,
      'f1': null,
    }
    const result = handleClick(cellKeyClicked, gameStatus);
    expect(result.activePiece).toBeNull();
    expect(result.possiblePasses).toBe([]);
    expect(result.possibleMoves).toBe([]);
    expect(result.gameBoard).toEqual(gameStatus.gameBoard);
    expect(result.movedPiece).toBeNull();
    expect(result.originalSquare).toBeNull();
  });

  it('click on non-piece with no active piece', () => {
    const cellKeyClicked = 'a1'
    const gameStatus = {
      'activePiece': null,
      'a1': { piece: 'rook', color: 'white' },
      'b1': null,
      'c1': null,
      'd1': null,
      'e1': null,
      'f1': null,
    }
    const result = handleClick(cellKeyClicked, gameStatus);
    expect(result.activePiece).toBeNull();
    expect(result.possiblePasses).toBe([]);
    expect(result.possibleMoves).toBe(['c3']);
    expect(result.gameBoard).toEqual(gameStatus.gameBoard);
    expect(result.movedPiece).toBeNull();
    expect(result.originalSquare).toBeNull();
  });

  it('click on non-piece with no active piece', () => {
    const cellKeyClicked = 'a1'
    const gameStatus = {
      'activePiece': null,
      'a1': { piece: 'rook', color: 'white' },
      'b1': null,
      'c1': null,
      'd1': null,
      'e1': null,
      'f1': null,
    }
    const result = handleClick(cellKeyClicked, gameStatus);
    expect(result.activePiece).toBeNull();
    expect(result.possiblePasses).toBe([]);
    expect(result.possibleMoves).toBe(['c3']);
    expect(result.gameBoard).toEqual(gameStatus.gameBoard);
    expect(result.movedPiece).toBeNull();
    expect(result.originalSquare).toBeNull();
  });
});