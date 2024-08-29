import {initializeGameBoard} from '../utils/gameUtilities'; 

export const initializeGameModel = () => {
    return {
        id: '',
        status: 'not started',
        possibleMoves: [],
        turnPlayer: 'white',
        moveHistory: [],
        gameBoard: initializeGameBoard(),
    };
};
