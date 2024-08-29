import {initializeGameBoard} from '../../utils/gameUtilities';

export const initialGameState = () => {

  return {
    activePiece: null,  
    gameData: {
        activePiece : null,
        blackPlayerId: "31779eferfre",
        blackPlayerName : "Ben",
        createdAt: "2024-08-16T20:15:45.972Z",
        currentBoardStatus: initializeGameBoard(),
        currentPlayerTurn: 'white',
        hasMoved: false,
        moveHistory: [],
        originalSquare: null,
        status: 'playing',
        turnNumber: 0,
        whitePlayerId: '835w98029485-24',
        whitePlayerName: 'Ally',
        winner: null,
        __v: 0,
        _id: '1',
    },
    gameId: 34,
    possibleMoves: [],
    possiblePasses: [],
    isUserTurn: true,
    movedPiece: null,
    movedPieceOriginalPosition: null,
    playerColor: 'white',
    winner: null
  };
};

